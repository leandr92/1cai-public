"""
API endpoints для работы с базой знаний по конфигурациям 1С
Версия: 1.0.0
"""

import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from pathlib import Path
from src.services.configuration_knowledge_base import ConfigurationKnowledgeBase, get_knowledge_base

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== МОДЕЛИ ДАННЫХ ====================

class ConfigurationRequest(BaseModel):
    """Запрос информации о конфигурации"""
    configName: Literal["erp", "ut", "zup", "buh", "holding", "buhbit", "do", "ka"] = Field(
        ...,
        description="Название конфигурации"
    )


class ModuleDocumentationRequest(BaseModel):
    """Запрос на добавление документации модуля"""
    configName: str
    moduleName: str
    documentation: dict


class BestPracticeRequest(BaseModel):
    """Запрос на добавление best practice"""
    configName: str
    category: str
    practice: dict


class PatternSearchRequest(BaseModel):
    """Запрос на поиск паттернов"""
    configName: Optional[str] = None
    patternType: Optional[str] = None
    query: Optional[str] = None


class CodeRecommendationRequest(BaseModel):
    """Запрос рекомендаций на основе кода"""
    code: str = Field(..., description="Код для анализа")
    configName: Optional[str] = Field(None, description="Название конфигурации (опционально)")


# ==================== API ENDPOINTS ====================

@router.get(
    "/configurations",
    tags=["Knowledge Base"],
    summary="Список поддерживаемых конфигураций",
    description="Получение списка всех поддерживаемых типовых конфигураций 1С"
)
async def get_configurations():
    """Список конфигураций"""
    kb = get_knowledge_base()
    
    configurations = []
    for config_key in kb.SUPPORTED_CONFIGURATIONS:
        info = kb.get_configuration_info(config_key)
        if info:
            configurations.append({
                "id": config_key,
                "name": info.get("name", config_key),
                "modules_count": len(info.get("modules", [])),
                "best_practices_count": len(info.get("best_practices", [])),
                "patterns_count": len(info.get("common_patterns", []))
            })
    
    return {
        "configurations": configurations,
        "total": len(configurations)
    }


@router.get(
    "/configurations/{config_name}",
    tags=["Knowledge Base"],
    summary="Информация о конфигурации",
    description="Получение подробной информации о конкретной конфигурации"
)
async def get_configuration_info(config_name: str):
    """Информация о конфигурации"""
    kb = get_knowledge_base()
    info = kb.get_configuration_info(config_name)
    
    if not info:
        raise HTTPException(
            status_code=404,
            detail=f"Конфигурация {config_name} не найдена"
        )
    
    return info


@router.post(
    "/recommendations",
    tags=["Knowledge Base"],
    summary="Рекомендации на основе кода",
    description="Получение рекомендаций на основе анализа кода и базы знаний"
)
async def get_recommendations(request: CodeRecommendationRequest):
    """Рекомендации на основе кода"""
    try:
        kb = get_knowledge_base()
        recommendations = kb.get_recommendations(
            code=request.code,
            config_name=request.configName
        )
        
        return {
            "recommendations": recommendations,
            "total": len(recommendations)
        }
    
    except Exception as e:
        logger.error(f"Ошибка получения рекомендаций: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка получения рекомендаций: {str(e)}")


@router.post(
    "/patterns/search",
    tags=["Knowledge Base"],
    summary="Поиск паттернов",
    description="Поиск паттернов в базе знаний"
)
async def search_patterns(request: PatternSearchRequest):
    """Поиск паттернов"""
    try:
        kb = get_knowledge_base()
        patterns = kb.search_patterns(
            config_name=request.configName,
            pattern_type=request.patternType,
            query=request.query
        )
        
        return {
            "patterns": patterns,
            "total": len(patterns)
        }
    
    except Exception as e:
        logger.error(f"Ошибка поиска паттернов: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка поиска паттернов: {str(e)}")


@router.post(
    "/modules",
    tags=["Knowledge Base"],
    summary="Добавление документации модуля",
    description="Добавление документации модуля в базу знаний"
)
async def add_module_documentation(request: ModuleDocumentationRequest):
    """Добавление документации модуля"""
    try:
        kb = get_knowledge_base()
        success = kb.add_module_documentation(
            config_name=request.configName,
            module_name=request.moduleName,
            documentation=request.documentation
        )
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Не удалось добавить документацию модуля"
            )
        
        return {
            "success": True,
            "message": f"Документация модуля {request.moduleName} добавлена"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления документации: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка добавления документации: {str(e)}")


@router.post(
    "/best-practices",
    tags=["Knowledge Base"],
    summary="Добавление best practice",
    description="Добавление best practice в базу знаний"
)
async def add_best_practice(request: BestPracticeRequest):
    """Добавление best practice"""
    try:
        kb = get_knowledge_base()
        success = kb.add_best_practice(
            config_name=request.configName,
            category=request.category,
            practice=request.practice
        )
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Не удалось добавить best practice"
            )
        
        return {
            "success": True,
            "message": "Best practice добавлена"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка добавления best practice: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка добавления best practice: {str(e)}")


@router.post(
    "/load-from-directory",
    tags=["Knowledge Base"],
    summary="Загрузка конфигураций из директории",
    description="Загрузка конфигураций 1С из указанной директории"
)
async def load_from_directory(directory_path: str):
    """Загрузка конфигураций из директории"""
    try:
        kb = get_knowledge_base()
        loaded_count = kb.load_from_directory(directory_path)
        
        return {
            "success": True,
            "loaded_configurations": loaded_count,
            "message": f"Загружено конфигураций: {loaded_count}"
        }
    
    except Exception as e:
        logger.error(f"Ошибка загрузки из директории: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки: {str(e)}")


@router.get(
    "/health",
    tags=["Knowledge Base"],
    summary="Проверка состояния базы знаний"
)
async def health_check():
    """Проверка доступности базы знаний"""
    kb = get_knowledge_base()
    
    total_configs = 0
    total_modules = 0
    total_practices = 0
    total_patterns = 0
    
    for config_key in kb.SUPPORTED_CONFIGURATIONS:
        info = kb.get_configuration_info(config_key)
        if info:
            total_configs += 1
            total_modules += len(info.get("modules", []))
            total_practices += len(info.get("best_practices", []))
            total_patterns += len(info.get("common_patterns", []))
    
    return {
        "status": "healthy",
        "service": "knowledge-base",
        "version": "1.0.0",
        "statistics": {
            "total_configurations": total_configs,
            "total_modules": total_modules,
            "total_best_practices": total_practices,
            "total_patterns": total_patterns
        }
    }

