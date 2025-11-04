"""
Rate Limiting Middleware для FastAPI
Версия: 1.0.0
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from typing import Callable
import logging

logger = logging.getLogger(__name__)

# Создание лимитера
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000/hour"],  # По умолчанию 1000 запросов в час
    storage_uri="memory://"  # Можно заменить на Redis для распределенного лимитирования
)


def create_rate_limit_middleware(app):
    """Создание rate limiting middleware для приложения"""
    
    # Добавление обработчика ошибок rate limit
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next: Callable) -> Response:
        """Middleware для rate limiting"""
        
        # Пропускаем health checks и документацию
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Применяем лимиты (автоматически через декораторы)
        # Для публичных endpoints лимиты применяются через декораторы
        return await call_next(request)
    
    logger.info("Rate limiting middleware настроен")
    
    return app


# ==================== ДЕКОРАТОРЫ ДЛЯ ЛИМИТОВ ====================

def rate_limit(limit: str = "10/minute", per: str = None):
    """
    Декоратор для rate limiting endpoints
    
    Args:
        limit: Лимит запросов (например "10/minute", "100/hour")
        per: Дополнительный параметр (опционально)
    
    Примеры:
        @rate_limit("10/minute")  # 10 запросов в минуту
        @rate_limit("100/hour")    # 100 запросов в час
        @rate_limit("1000/day")    # 1000 запросов в день
    """
    def decorator(func):
        return limiter.limit(limit)(func)
    return decorator


# ==================== ПРЕДУСТАНОВЛЕННЫЕ ЛИМИТЫ ====================

# Публичные endpoints (Code Review, Test Generation)
PUBLIC_RATE_LIMIT = "20/minute"  # 20 запросов в минуту

# Защищенные endpoints (AI Assistants)
PROTECTED_RATE_LIMIT = "100/hour"  # 100 запросов в час

# Тяжелые операции (ML, анализ)
HEAVY_OPERATION_LIMIT = "10/hour"  # 10 запросов в час

# Легкие операции (health check, метрики)
LIGHT_OPERATION_LIMIT = "1000/hour"  # 1000 запросов в час





