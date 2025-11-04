"""
Code Approval API - для human-in-the-loop approval process
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional

from src.ai.agents.developer_agent_secure import DeveloperAISecure
from src.database import get_pool


router = APIRouter(prefix="/api/code-approval", tags=["Code Approval"])


class CodeGenerationRequest(BaseModel):
    prompt: str
    context: Optional[dict] = None
    user_id: str


class CodeApprovalRequest(BaseModel):
    token: str
    approved_by_user: str
    changes_made: Optional[str] = None


class BulkApprovalRequest(BaseModel):
    tokens: List[str]
    approved_by_user: str


# Singleton agent instance
_developer_ai = None

def get_developer_ai() -> DeveloperAISecure:
    global _developer_ai
    if _developer_ai is None:
        _developer_ai = DeveloperAISecure()
    return _developer_ai


@router.post("/generate")
async def generate_code(
    request: CodeGenerationRequest,
    agent: DeveloperAISecure = Depends(get_developer_ai)
):
    """
    Генерирует код с AI
    
    Возвращает suggestion с токеном для approval
    """
    result = agent.generate_code(
        prompt=request.prompt,
        context={'user_id': request.user_id, **(request.context or {})}
    )
    
    if result.get('blocked'):
        raise HTTPException(
            status_code=403,
            detail=result.get('error', 'Request blocked by security')
        )
    
    return {
        'success': True,
        'suggestion': result['suggestion'],
        'token': result['token'],
        'safety': result['safety'],
        'requires_approval': result['requires_approval'],
        'can_auto_apply': result['can_auto_apply'],
        'preview_url': result['preview_url'],
        'redacted': result.get('redacted', False)
    }


@router.get("/preview/{token}")
async def get_preview(
    token: str,
    agent: DeveloperAISecure = Depends(get_developer_ai)
):
    """
    Получить preview suggestion для review
    """
    if token not in agent._pending_suggestions:
        raise HTTPException(status_code=404, detail="Token not found or expired")
    
    suggestion_data = agent._pending_suggestions[token]
    
    return {
        'suggestion': suggestion_data['suggestion'],
        'prompt': suggestion_data['prompt'],
        'safety': suggestion_data['safety'],
        'created_at': suggestion_data['created_at'].isoformat(),
        'expires_at': (suggestion_data['created_at'] + timedelta(minutes=30)).isoformat()
    }


@router.post("/approve")
async def approve_suggestion(
    request: CodeApprovalRequest,
    agent: DeveloperAISecure = Depends(get_developer_ai)
):
    """
    Одобрить и применить suggestion
    
    КРИТИЧНО: Требует human approval!
    """
    result = agent.apply_suggestion(
        token=request.token,
        approved_by_user=request.approved_by_user,
        changes_made=request.changes_made
    )
    
    if result.get('blocked'):
        raise HTTPException(
            status_code=403,
            detail=result.get('error', 'Application blocked')
        )
    
    return {
        'success': True,
        'applied': True,
        'commit_sha': result.get('commit_sha'),
        'message': 'Code suggestion applied successfully'
    }


@router.post("/approve-all")
async def bulk_approve(
    request: BulkApprovalRequest,
    agent: DeveloperAISecure = Depends(get_developer_ai)
):
    """
    Bulk approval для множества suggestions
    
    Применяется только к безопасным (score > 0.95)
    """
    result = agent.bulk_approve_safe_suggestions(
        tokens=request.tokens,
        approved_by_user=request.approved_by_user
    )
    
    return {
        'success': True,
        'approved': len(result['approved']),
        'rejected': len(result['rejected']),
        'errors': len(result['errors']),
        'details': result
    }


@router.delete("/reject/{token}")
async def reject_suggestion(
    token: str,
    agent: DeveloperAISecure = Depends(get_developer_ai)
):
    """
    Отклонить suggestion
    """
    if token not in agent._pending_suggestions:
        raise HTTPException(status_code=404, detail="Token not found")
    
    # Удаляем из pending
    del agent._pending_suggestions[token]
    
    return {
        'success': True,
        'message': 'Suggestion rejected'
    }


@router.get("/pending")
async def get_pending_suggestions(
    user_id: str,
    agent: DeveloperAISecure = Depends(get_developer_ai)
):
    """
    Получить все pending suggestions для пользователя
    """
    user_suggestions = []
    
    for token, data in agent._pending_suggestions.items():
        if data['context'].get('user_id') == user_id:
            user_suggestions.append({
                'token': token,
                'prompt': data['prompt'],
                'created_at': data['created_at'].isoformat(),
                'safety_score': data['safety']['score'],
                'can_auto_apply': data['safety']['score'] > 0.95
            })
    
    return {
        'pending': len(user_suggestions),
        'suggestions': user_suggestions
    }


