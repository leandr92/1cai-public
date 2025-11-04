"""
FastAPI endpoints для AI-ассистентов
Предоставляет REST API для взаимодействия с различными AI-ассистентами
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from ..ai_assistants.base_assistant import AssistantMessage, AssistantResponse
from ..ai_assistants.architect_assistant import ArchitectAssistant
from ..config import settings


# Pydantic модели для запросов и ответов
class ChatRequest(BaseModel):
    """Запрос для чата с ассистентом"""
    query: str = Field(..., description="Сообщение пользователя")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Дополнительный контекст")
    conversation_id: Optional[str] = Field(default=None, description="ID диалога")


class ChatResponse(BaseModel):
    """Ответ от ассистента"""
    message_id: str
    content: str
    role: str
    timestamp: datetime
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float
    conversation_id: str


class AnalyzeRequirementsRequest(BaseModel):
    """Запрос на анализ требований"""
    requirements_text: str = Field(..., description="Текст с требованиями")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Контекст проекта")


class GenerateDiagramRequest(BaseModel):
    """Запрос на генерацию диаграммы"""
    architecture_proposal: Dict[str, Any] = Field(..., description="Предложение архитектуры")
    diagram_type: str = Field(default="flowchart", description="Тип диаграммы")
    diagram_requirements: Optional[Dict[str, Any]] = Field(default=None, description="Требования к диаграмме")


class ComprehensiveAnalysisRequest(BaseModel):
    """Запрос на комплексный анализ"""
    requirements_text: str = Field(..., description="Текст с требованиями")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Контекст проекта")


class RiskAssessmentRequest(BaseModel):
    """Запрос на оценку рисков"""
    architecture: Dict[str, Any] = Field(..., description="Архитектурное решение")
    project_context: Optional[Dict[str, Any]] = Field(default=None, description="Контекст проекта")


# Создаем router
router = APIRouter(prefix="/api/assistants", tags=["AI Assistants"])

# Инициализируем ассистентов
assistants: Dict[str, Any] = {}
assistant_instances: Dict[str, Any] = {}


async def get_architect_assistant() -> ArchitectAssistant:
    """Зависимость для получения ассистента архитектора"""
    if "architect" not in assistant_instances:
        assistant_instances["architect"] = ArchitectAssistant()
    return assistant_instances["architect"]


# Инициализация логгера
logger = logging.getLogger(__name__)


@router.get("/health", summary="Проверка состояния API")
async def health_check():
    """Проверка состояния AI-ассистентов API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "available_assistants": list(assistant_instances.keys()) if assistant_instances else [],
        "version": "1.0.0"
    }


@router.get("/", summary="Список доступных ассистентов")
async def list_assistants():
    """Получение списка всех доступных AI-ассистентов"""
    return {
        "assistants": settings.assistant_configs,
        "total_count": len(settings.assistant_configs)
    }


@router.post("/chat/{assistant_role}", response_model=ChatResponse, summary="Чат с ассистентом")
async def chat_with_assistant(
    assistant_role: str,
    request: ChatRequest,
    assistant = Depends(get_architect_assistant)  # Пока используем только архитектора
):
    """
    Общение с конкретным ассистентом
    
    Args:
        assistant_role: Роль ассистента (architect, developer, tester, pm, analyst)
        request: Запрос пользователя
        assistant: Экземпляр ассистента
    """
    try:
        # Валидируем роль ассистента
        if assistant_role not in settings.assistant_configs:
            raise HTTPException(status_code=404, detail=f"Ассистент с ролью '{assistant_role}' не найден")
        
        # Обрабатываем запрос
        response = await assistant.process_query(
            query=request.query,
            context=request.context,
            user_id=request.conversation_id
        )
        
        return ChatResponse(
            message_id=response.message.id,
            content=response.message.content,
            role=response.message.role,
            timestamp=response.message.timestamp,
            sources=[{
                "page_content": doc.page_content,
                "metadata": doc.metadata
            } for doc in response.sources],
            confidence=response.confidence,
            conversation_id=request.conversation_id or "default"
        )
        
    except Exception as e:
        logger.error(f"Ошибка при обработке чата: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/architect/analyze-requirements", summary="Анализ требований для архитектора")
async def analyze_requirements(
    request: AnalyzeRequirementsRequest,
    assistant: ArchitectAssistant = Depends(get_architect_assistant)
):
    """
    Специализированный анализ бизнес-требований для архитектора
    
    Args:
        request: Запрос с требованиями
        assistant: Ассистент архитектора
        
    Returns:
        Структурированный анализ требований
    """
    try:
        result = await assistant.analyze_requirements(
            requirements_text=request.requirements_text,
            context=request.context
        )
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Ошибка при анализе требований: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/architect/generate-diagram", summary="Генерация архитектурной диаграммы")
async def generate_diagram(
    request: GenerateDiagramRequest,
    assistant: ArchitectAssistant = Depends(get_architect_assistant)
):
    """
    Генерация архитектурной диаграммы в формате Mermaid
    
    Args:
        request: Запрос с архитектурным предложением
        assistant: Ассистент архитектора
        
    Returns:
        Код диаграммы и описание архитектуры
    """
    try:
        result = await assistant.generate_diagram(
            architecture_proposal=request.architecture_proposal,
            diagram_type=request.diagram_type,
            diagram_requirements=request.diagram_requirements
        )
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Ошибка при генерации диаграммы: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/architect/comprehensive-analysis", summary="Комплексный анализ архитектора")
async def comprehensive_analysis(
    request: ComprehensiveAnalysisRequest,
    assistant: ArchitectAssistant = Depends(get_architect_assistant)
):
    """
    Полный анализ: требования + архитектура + риски
    
    Args:
        request: Запрос с требованиями
        assistant: Ассистент архитектора
        
    Returns:
        Полный анализ с рекомендациями
    """
    try:
        result = await assistant.create_comprehensive_analysis(
            requirements_text=request.requirements_text,
            context=request.context
        )
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Ошибка при комплексном анализе: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/architect/assess-risks", summary="Оценка рисков архитектуры")
async def assess_risks(
    request: RiskAssessmentRequest,
    assistant: ArchitectAssistant = Depends(get_architect_assistant)
):
    """
    Оценка рисков архитектурного решения
    
    Args:
        request: Запрос с архитектурой
        assistant: Ассистент архитектора
        
    Returns:
        Анализ рисков и стратегии минимизации
    """
    try:
        result = await assistant.assess_risks(
            architecture=request.architecture,
            project_context=request.project_context
        )
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Ошибка при оценке рисков: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/architect/conversation-history", summary="История диалогов архитектора")
async def get_conversation_history(
    limit: int = 50,
    assistant: ArchitectAssistant = Depends(get_architect_assistant)
):
    """
    Получение истории диалогов с ассистентом архитектора
    
    Args:
        limit: Количество сообщений для возврата
        assistant: Ассистент архитектора
        
    Returns:
        История диалогов
    """
    try:
        history = assistant.get_conversation_history(limit=limit)
        
        return {
            "success": True,
            "data": {
                "conversation_history": [
                    {
                        "id": msg.id,
                        "role": msg.role,
                        "content": msg.content,
                        "timestamp": msg.timestamp,
                        "context": msg.context,
                        "metadata": msg.metadata
                    }
                    for msg in history
                ],
                "total_count": len(history)
            },
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении истории: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/architect/conversation-history", summary="Очистка истории диалогов")
async def clear_conversation_history(
    assistant: ArchitectAssistant = Depends(get_architect_assistant)
):
    """
    Очистка истории диалогов с ассистентом архитектора
    
    Args:
        assistant: Ассистент архитектора
        
    Returns:
        Подтверждение очистки
    """
    try:
        assistant.clear_conversation_history()
        
        return {
            "success": True,
            "message": "История диалогов очищена",
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Ошибка при очистке истории: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/architect/stats", summary="Статистика ассистента архитектора")
async def get_assistant_stats(
    assistant: ArchitectAssistant = Depends(get_architect_assistant)
):
    """
    Получение статистики использования ассистента
    
    Args:
        assistant: Ассистент архитектора
        
    Returns:
        Статистика использования
    """
    try:
        stats = await assistant.get_stats()
        
        return {
            "success": True,
            "data": stats,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Ошибка при получении статистики: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge/add", summary="Добавление знаний в базу ассистента")
async def add_knowledge(
    documents: List[Dict[str, Any]],
    role: str = "architect",
    user_id: str = "system",
    assistant: ArchitectAssistant = Depends(get_architect_assistant)
):
    """
    Добавление новых документов в базу знаний ассистента
    
    Args:
        documents: Список документов для добавления
        role: Роль ассистента
        user_id: ID пользователя
        assistant: Ассистент архитектора
        
    Returns:
        Подтверждение добавления
    """
    try:
        await assistant.add_knowledge(documents=documents, user_id=user_id)
        
        return {
            "success": True,
            "message": f"Добавлено {len(documents)} документов в базу знаний",
            "documents_count": len(documents),
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Ошибка при добавлении знаний: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Создаем основное приложение
def create_app() -> APIRouter:
    """Создание FastAPI приложения"""
    return router


# Экспортируем router для использования в main.py
__all__ = ["router", "create_app"]