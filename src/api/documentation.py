"""
API endpoints для автоматической генерации документации
Версия: 1.0.0
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from src.services.documentation_generation_service import get_documentation_generator

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== МОДЕЛИ ДАННЫХ ====================

class DocumentationRequest(BaseModel):
    """Запрос на генерацию документации"""
    code: str = Field(..., description="Исходный код для документирования")
    language: Literal["bsl", "typescript", "javascript", "python"] = Field(
        default="bsl",
        description="Язык программирования"
    )
    functionName: Optional[str] = Field(None, description="Имя конкретной функции для документирования")
    format: Literal["markdown", "html", "plain"] = Field(
        default="markdown",
        description="Формат документации"
    )


class DocumentationResponse(BaseModel):
    """Ответ генерации документации"""
    title: str
    language: str
    format: str
    content: str
    sections: list
    generatedAt: datetime = Field(default_factory=datetime.now)
    generationId: str


# ==================== API ENDPOINTS ====================

@router.post(
    "/generate",
    response_model=DocumentationResponse,
    tags=["Documentation"],
    summary="Генерация документации из кода",
    description="Автоматическая генерация документации для указанного кода"
)
async def generate_documentation(request: DocumentationRequest):
    """Генерация документации"""
    
    try:
        doc_generator = get_documentation_generator()
        
        doc = doc_generator.generate_documentation(
            code=request.code,
            language=request.language,
            function_name=request.functionName,
            format=request.format
        )
        
        generation_id = f"doc-{datetime.now().timestamp()}"
        
        return DocumentationResponse(
            title=doc["title"],
            language=doc["language"],
            format=request.format,
            content=doc["content"],
            sections=doc["sections"],
            generationId=generation_id
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Ошибка генерации документации: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка генерации документации: {str(e)}")


@router.get(
    "/health",
    tags=["Documentation"],
    summary="Проверка состояния сервиса"
)
async def health_check():
    """Проверка доступности сервиса генерации документации"""
    return {
        "status": "healthy",
        "service": "documentation-generation",
        "version": "1.0.0",
        "supported_languages": ["bsl"],
        "supported_formats": ["markdown", "html", "plain"]
    }





