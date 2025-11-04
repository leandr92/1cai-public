# Интеграция HTTP кэширования с существующим MCP сервером

Этот файл содержит инструкции по интеграции модуля HTTP кэширования с существующим кодом из `1c_mcp/src/py_server/`.

## Обзор изменений

Интеграция включает:
1. Добавление middleware для HTTP кэширования
2. Настройку различных стратегий кэширования
3. Интеграцию с OAuth2 авторизацией
4. Добавление endpoints для мониторинга

## Файлы для изменения

### 1. main.py - Добавление конфигурации кэша

```python
# Добавить в imports
from .config import get_config
from .http_cache import setup_cache_middleware
from .cache import metrics_collector

# В функции main(), после получения конфигурации:
try:
    config = get_config()
    
    # Добавляем конфигурацию кэша
    cache_config = {
        "secret_key": getattr(config, 'cache_secret_key', "mcp_cache_secret_2024"),
        "cache_ttl": getattr(config, 'cache_ttl', 3600),
        "max_cache_size": getattr(config, 'max_cache_size', 1000),
        "excluded_paths": {
            "/health", "/info", "/token", "/authorize", "/register",
            "/.well-known/oauth-*", "/cache/admin/*"
        }
    }
    
except Exception as e:
    # ...
```

### 2. http_server.py - Интеграция middleware

```python
# В начале файла, добавить:
from .cache.http_cache import (
    setup_cache_middleware, 
    CacheHeaders,
    ETagManager,
    CacheEntry
)

# В классе MCPHttpServer, в методе __init__:
class MCPHttpServer:
    def __init__(self, config: Config):
        # ... существующий код ...
        
        # Настраиваем HTTP кэширование
        cache_config = {
            "secret_key": getattr(config, 'cache_secret_key', "mcp_cache_secret_2024"),
            "cache_ttl": getattr(config, 'cache_ttl', 1800),  # 30 минут по умолчанию
            "max_cache_size": getattr(config, 'max_cache_size', 1000),
            "excluded_paths": {
                "/health", "/info", "/token", "/authorize", "/register",
                "/.well-known/oauth-*"
            }
        }
        
        # Создаем приложение с кэшированием
        self.app = setup_cache_middleware(
            app=self.app,
            **cache_config
        )
        
        # Регистрируем middleware для метрик
        self._setup_cache_monitoring()
    
    def _setup_cache_monitoring(self):
        """Настройка мониторинга кэша."""
        
        @self.app.get("/cache/metrics")
        async def get_cache_metrics():
            """Метрики кэша."""
            from .cache import metrics_collector
            return metrics_collector.get_summary()
        
        @self.app.get("/cache/metrics.prometheus")
        async def get_cache_metrics_prometheus():
            """Метрики в формате Prometheus."""
            from .cache import metrics_collector
            from fastapi.responses import PlainTextResponse
            return PlainTextResponse(
                content=metrics_collector.export_prometheus(),
                media_type="text/plain"
            )
        
        @self.app.post("/cache/admin/clear")
        async def clear_cache():
            """Очистка кэша (только для администраторов)."""
            # TODO: добавить проверку прав администратора
            from .cache import metrics_collector
            for middleware in metrics_collector.middlewares:
                middleware._cache.clear()
                middleware._cache_order.clear()
            return {"status": "cleared", "message": "Cache cleared"}
```

### 3. Добавление кастомных стратегий кэширования

Создать файл `cache_strategies.py`:

```python
"""Стратегии кэширования для разных типов данных."""

from fastapi import Response
from fastapi.responses import JSONResponse
from .http_cache import CacheHeaders

def apply_metadata_cache_strategy(response: Response) -> Response:
    """Применяет стратегию кэширования для метаданных 1С."""
    cache_control = CacheHeaders.create_cache_control(
        public=True,
        max_age=86400,  # 24 часа
        s_maxage=43200,  # 12 часов для CDN
        immutable=True  # Метаданные редко меняются
    )
    response.headers["Cache-Control"] = cache_control
    response.headers["X-Content-Type"] = "metadata"
    return response

def apply_dynamic_data_cache_strategy(response: Response) -> Response:
    """Применяет стратегию кэширования для динамических данных."""
    cache_control = CacheHeaders.create_cache_control(
        public=True,
        max_age=300,  # 5 минут
        s_maxage=60,  # 1 минута для CDN
        stale_while_revalidate=30,
        stale_if_error=300
    )
    response.headers["Cache-Control"] = cache_control
    response.headers["X-Content-Type"] = "dynamic"
    return response

def apply_personal_data_cache_strategy(response: Response) -> Response:
    """Применяет стратегию кэширования для персональных данных."""
    cache_control = CacheHeaders.create_cache_control(
        private=True,
        max_age=1800,  # 30 минут
        no_cache=False
    )
    response.headers["Cache-Control"] = cache_control
    response.headers["X-Content-Type"] = "personal"
    return response

def apply_api_cache_strategy(response: Response) -> Response:
    """Применяет стратегию кэширования для API endpoints."""
    cache_control = CacheHeaders.create_cache_control(
        public=True,
        max_age=180,  # 3 минуты
        s_maxage=30,  # 30 секунд для CDN
        stale_while_revalidate=60,
        stale_if_error=600
    )
    response.headers["Cache-Control"] = cache_control
    response.headers["X-Content-Type"] = "api"
    return response
```

### 4. Обновление существующих endpoints

В `http_server.py`, добавить к существующим endpoints:

```python
# В методе setup_routes() добавить:

@self.app.get("/mcp/health")
async def health_check():
    """Проверка состояния (НЕ кэшируется)."""
    try:
        # Проверяем доступность 1С
        health_status = await self.onec_client.check_health()
        
        return {
            "status": "ok" if health_status else "degraded",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "cache_enabled": True,
            "cache_stats": metrics_collector.get_summary() if hasattr(metrics_collector, 'get_summary') else {}
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@self.app.get("/info")
async def server_info():
    """Информация о сервере с кэшированием."""
    info = {
        "name": "MCP-прокси сервер с HTTP кэшированием",
        "version": "2.0.0",
        "description": "MCP-прокси для взаимодействия с 1С с поддержкой HTTP кэширования",
        "features": [
            "HTTP caching with ETag",
            "Conditional GET requests (If-None-Match, If-Modified-Since)",
            "304 Not Modified responses",
            "Multiple cache strategies",
            "Cache metrics and monitoring",
            "Integration with OAuth2",
            "Support for various content types"
        ],
        "cache": {
            "enabled": True,
            "strategies": ["metadata", "dynamic", "personal", "api"],
            "metrics": metrics_collector.get_summary() if hasattr(metrics_collector, 'get_summary') else {}
        }
    }
    
    # Применяем стратегию кэширования для информации о сервере
    response = JSONResponse(content=info)
    response = apply_metadata_cache_strategy(response)
    return response

# Для MCP endpoints добавить кэширование:

@self.app.get("/mcp/tools/list")
async def list_tools_cached():
    """Список инструментов с кэшированием."""
    try:
        tools = await self.mcp_proxy.list_tools()
        
        # Применяем стратегию кэширования для инструментов
        response = JSONResponse(content={"tools": tools})
        response = apply_metadata_cache_strategy(response)
        
        return response
    except Exception as e:
        logger.error(f"Failed to list tools: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@self.app.get("/mcp/resources/list")
async def list_resources_cached():
    """Список ресурсов с кэшированием."""
    try:
        resources = await self.mcp_proxy.list_resources()
        
        response = JSONResponse(content={"resources": resources})
        response = apply_metadata_cache_strategy(response)
        
        return response
    except Exception as e:
        logger.error(f"Failed to list resources: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 5. Обновление конфигурации

В `config.py` добавить:

```python
from pydantic import BaseSettings

class Config(BaseSettings):
    # ... существующие поля ...
    
    # Конфигурация кэширования
    cache_secret_key: str = "mcp_cache_secret_2024"
    cache_ttl: int = 1800  # 30 минут
    cache_max_size: int = 1000
    cache_log_level: str = "INFO"
    
    class Config:
        env_prefix = "MCP_"
```

### 6. Обновление requirements.txt

Добавить в основной файл requirements.txt:

```txt
# Дополнительные зависимости не требуются
# Все необходимые компоненты уже включены в FastAPI и стандартную библиотеку
```

## Переменные окружения

Добавить в `.env` файл:

```bash
# HTTP кэширование
MCP_CACHE_SECRET_KEY=your_secret_key_here
MCP_CACHE_TTL=1800
MCP_CACHE_MAX_SIZE=1000
MCP_CACHE_LOG_LEVEL=INFO
```

## Тестирование интеграции

### 1. Проверка базового функционирования
```bash
# Запуск сервера
python -m src.py_server http --port 8000

# Проверка кэширования
curl -i http://localhost:8000/info
# Должен вернуть заголовки: ETag, Cache-Control, X-Cache: MISS

# Повторный запрос
curl -i http://localhost:8000/info
# Должен вернуть: X-Cache: HIT

# Условный запрос
curl -i -H "If-None-Match: \"your-etag\"" http://localhost:8000/info
# Должен вернуть: 304 Not Modified
```

### 2. Проверка метрик
```bash
# Получение метрик
curl http://localhost:8000/cache/metrics | jq

# Прометеус метрики
curl http://localhost:8000/cache/metrics.prometheus
```

### 3. Проверка интеграции с OAuth2
```bash
# Убедиться что пути авторизации не кэшируются
curl -i http://localhost:8000/token
# Должен вернуть: X-Cache: BYPASS
```

## Мониторинг в продакшене

### 1. Логирование
```python
# В main.py настроить логирование кэша
import logging

# Создаем отдельный logger для кэша
cache_logger = logging.getLogger("cache.http_cache")
cache_handler = logging.FileHandler("cache.log")
cache_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
cache_handler.setFormatter(cache_formatter)
cache_logger.addHandler(cache_handler)
cache_logger.setLevel(logging.INFO)
```

### 2. Метрики для Prometheus
```python
# В production настроить экспорт метрик
if config.environment == "production":
    @app.get("/metrics")
    async def prometheus_metrics():
        return PlainTextResponse(
            content=metrics_collector.export_prometheus(),
            media_type="text/plain"
        )
```

### 3. Алертинг
Настроить алерты на:
- Hit ratio < 70%
- Average cache time > 100ms
- Cache error rate > 5%

## Производительность

### Ожидаемые улучшения
- **Снижение нагрузки на 1С**: 60-80%
- **Ускорение ответов**: 5-10x для кэшируемых данных
- **Снижение трафика**: 70% за счет 304 ответов

### Оптимизация
1. Настроить appropriate TTL для разных endpoints
2. Использовать CDN для статических ресурсов
3. Мониторить размер кэша и настраивать LRU
4. Реализовать cache warming для критичных данных

## Безопасность

1. **Использовать уникальный secret_key** в production
2. **Исключать конфиденциальные пути** из кэширования
3. **Для персонализированных данных** использовать `private`
4. **Регулярно обновлять ETag** при изменениях

## Откат изменений

В случае проблем можно легко отключить кэширование:

1. Удалить middleware из `__init__`
2. Убрать кэш endpoints
3. Очистить кэш

```python
# Временное отключение кэширования
# Закомментировать строку:
# self.app = setup_cache_middleware(app=self.app, **cache_config)
```

## Поддержка

При возникновении проблем:
1. Проверить логи кэша
2. Испузовать endpoints мониторинга
3. Протестировать с curl
4. Обратиться к документации RFC 7234