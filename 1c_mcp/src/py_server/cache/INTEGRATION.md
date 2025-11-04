# Интеграция OAuth Cache с 1C MCP Server

Данное руководство описывает процесс интеграции модуля OAuth Cache с существующим 1C MCP сервером.

## Обзор интеграции

Модуль OAuth Cache полностью совместим с существующей архитектурой сервера:

```
1C MCP Server
├── auth/
│   └── oauth2.py (существующий модуль)
├── cache/ (новый модуль)
│   ├── __init__.py
│   ├── oauth_cache.py
│   ├── integration_example.py
│   └── test_oauth_cache.py
└── main.py (точка входа)
```

## Изменения в основных файлах

### 1. Обновление main.py

Добавьте инициализацию кэш-менеджера в главный файл сервера:

```python
# main.py - добавления

from cache import OAuthCacheManager, OAuthCacheFactory
import asyncio
import logging

logger = logging.getLogger(__name__)

class MCPServerWithCache:
    """MCP сервер с интеграцией OAuth Cache."""
    
    def __init__(self):
        # Существующая инициализация...
        self.oauth_cache = None
        
    async def setup_oauth_cache(self, environment="production"):
        """Настройка OAuth кэша."""
        try:
            # Создаем кэш-менеджер
            self.oauth_cache = OAuthCacheFactory.create_production_cache(
                max_tokens=5000,
                max_sessions=50000
            )
            
            await self.oauth_cache.initialize()
            logger.info("OAuth Cache успешно инициализирован")
            
        except Exception as e:
            logger.error(f"Ошибка инициализации OAuth Cache: {e}")
            raise
    
    async def shutdown(self):
        """Корректное завершение работы."""
        if self.oauth_cache:
            await self.oauth_cache.shutdown()
        # Существующий код завершения...
```

### 2. Обновление http_server.py

Интегрируйте валидацию токенов в HTTP обработчики:

```python
# http_server.py - добавления

from cache import OAuthCacheManager
import aiohttp
from aiohttp import web

class HTTPServerWithCache:
    """HTTP сервер с OAuth Cache интеграцией."""
    
    def __init__(self, oauth_cache: OAuthCacheManager):
        self.oauth_cache = oauth_cache
        self.app = web.Application()
        self.setup_routes()
    
    def setup_routes(self):
        """Настройка маршрутов с валидацией токенов."""
        
        # Защищенный маршрут
        self.app.router.add_get('/api/protected', self.protected_handler)
        
        # Публичный маршрут
        self.app.router.add_get('/api/public', self.public_handler)
        
        # Маршрут для получения статуса кэша
        self.app.router.add_get('/cache/status', self.cache_status_handler)
    
    async def protected_handler(self, request):
        """Защищенный обработчик с проверкой токена."""
        # Извлекаем токен из заголовка
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return web.Response(
                status=401,
                json={"error": "Токен не предоставлен"}
            )
        
        access_token = auth_header[7:]  # Убираем "Bearer "
        
        # Валидируем токен через кэш
        validation = await self.oauth_cache.validate_access_token(access_token)
        
        if not validation:
            return web.Response(
                status=401,
                json={"error": "Недействительный токен"}
            )
        
        # Добавляем информацию о пользователе в request
        request['user_info'] = validation
        
        # Обрабатываем запрос
        return web.json_response({
            "message": "Защищенный ресурс",
            "user": validation.get("user_data"),
            "token_expires_in": validation.get("expires_in")
        })
    
    async def cache_status_handler(self, request):
        """Обработчик для получения статуса кэша."""
        try:
            stats = await self.oauth_cache.get_comprehensive_stats()
            return web.json_response(stats)
        except Exception as e:
            return web.json_response(
                {"error": f"Ошибка получения статуса: {str(e)}"},
                status=500
            )
```

### 3. Обновление auth/oauth2.py

Интегрируйте кэширование в существующий OAuth2 сервис:

```python
# auth/oauth2.py - добавления

from cache import OAuthCacheManager

class OAuth2ServiceWithCache:
    """OAuth2 сервис с кэшированием."""
    
    def __init__(self, store: OAuth2Store, oauth_cache: OAuthCacheManager):
        # Существующая инициализация...
        self.oauth_cache = oauth_cache
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str, code_verifier: str):
        """Обмен кода на токены с кэшированием."""
        # Существующая логика обмена...
        tokens_data = super().exchange_code_for_tokens(code, redirect_uri, code_verifier)
        
        if tokens_data:
            access_token, token_type, expires_in, refresh_token = tokens_data
            
            # Кэшируем токены
            asyncio.create_task(self._cache_tokens(access_token, refresh_token, token_type, expires_in))
        
        return tokens_data
    
    async def _cache_tokens(self, access_token: str, refresh_token: str, 
                          token_type: str, expires_in: int):
        """Кэширование токенов."""
        try:
            user_id = self._extract_user_id_from_token(access_token)  # Ваша логика
            
            await self.oauth_cache.store_oauth_token(
                user_id=user_id,
                access_token=access_token,
                refresh_token=refresh_token,
                token_type=token_type,
                expires_in=expires_in,
                user_data={
                    "token_type": token_type,
                    "issued_at": datetime.now().isoformat(),
                    "oauth_service": "oauth2_with_cache"
                }
            )
            
            logger.debug(f"Токены кэшированы для пользователя {user_id}")
            
        except Exception as e:
            logger.error(f"Ошибка кэширования токенов: {e}")
```

### 4. Добавление middleware для автоматической валидации

Создайте middleware для автоматической валидации всех запросов:

```python
# middleware/auth_middleware.py

from aiohttp import web
from cache import OAuthCacheManager
import logging

logger = logging.getLogger(__name__)

class AuthMiddleware:
    """Middleware для автоматической аутентификации."""
    
    def __init__(self, oauth_cache: OAuthCacheManager, exclude_paths: list = None):
        self.oauth_cache = oauth_cache
        self.exclude_paths = exclude_paths or ['/health', '/metrics', '/cache/status']
    
    async def auth_middleware(self, request, handler):
        """Middleware функция."""
        # Пропускаем публичные маршруты
        if request.path in self.exclude_paths:
            return await handler(request)
        
        # Извлекаем токен из заголовка
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return web.Response(
                status=401,
                json={"error": "Требуется токен авторизации"}
            )
        
        access_token = auth_header[7:]
        
        # Валидируем токен
        validation = await self.oauth_cache.validate_access_token(access_token)
        if not validation:
            return web.Response(
                status=401,
                json={"error": "Недействительный токен"}
            )
        
        # Добавляем информацию о пользователе
        request['user'] = validation['user_data']
        request['token_info'] = validation
        
        # Обновляем активность сессии если есть session_id
        if 'session_id' in validation.get('user_data', {}):
            await self.oauth_cache.cache_manager.session_manager.update_activity(
                validation['user_data']['session_id']
            )
        
        return await handler(request)

# Настройка middleware
def setup_auth_middleware(app: web.Application, oauth_cache: OAuthCacheManager):
    """Настройка middleware для приложения."""
    auth_middleware = AuthMiddleware(oauth_cache)
    app.middlewares.append(auth_middleware.auth_middleware)
```

## Пример использования в обработчиках

### Обновление существующих обработчиков

```python
# examples/updated_handlers.py

from aiohttp import web
from cache import OAuthCacheManager
import asyncio

async def get_1c_data(request):
    """Обновленный обработчик для получения данных 1С."""
    user_info = request.get('user')
    if not user_info:
        return web.Response(status=401, text="Неавторизован")
    
    try:
        # Извлекаем токен для 1С из кэша
        token_info = request.get('token_info', {})
        access_token = token_info.get('access_token')
        
        if not access_token:
            return web.Response(status=401, text="Токен не найден")
        
        # Используем токен для запроса к 1С
        onec_client = OneCClient(access_token=access_token)
        data = await onec_client.get_data()
        
        return web.json_response({
            "data": data,
            "user": user_info.get('login'),
            "expires_in": token_info.get('expires_in')
        })
        
    except Exception as e:
        logger.error(f"Ошибка получения данных 1С: {e}")
        return web.Response(status=500, text="Внутренняя ошибка")

async def update_1c_data(request):
    """Обновленный обработчик для обновления данных 1С."""
    user_info = request.get('user')
    if not user_info:
        return web.Response(status=401, text="Неавторизован")
    
    try:
        # Получаем данные из запроса
        data = await request.json()
        
        # Проверяем права пользователя
        if not await check_user_permissions(user_info, 'write'):
            return web.Response(status=403, text="Недостаточно прав")
        
        # Используем токен для обновления
        token_info = request.get('token_info', {})
        access_token = token_info.get('access_token')
        
        onec_client = OneCClient(access_token=access_token)
        result = await onec_client.update_data(data)
        
        # Обновляем статистику использования
        await update_user_activity_stats(user_info['user_identifier'])
        
        return web.json_response({
            "success": True,
            "result": result,
            "updated_by": user_info.get('login')
        })
        
    except PermissionError:
        return web.Response(status=403, text="Доступ запрещен")
    except Exception as e:
        logger.error(f"Ошибка обновления данных 1С: {e}")
        return web.Response(status=500, text="Внутренняя ошибка")
```

## Настройка конфигурации

### Добавление параметров кэша в config.py

```python
# config.py - дополнения

class CacheConfig:
    """Конфигурация OAuth Cache."""
    
    def __init__(self):
        # Размеры кэша
        self.max_token_cache_size = int(os.getenv('MAX_TOKEN_CACHE_SIZE', '1000'))
        self.max_sessions = int(os.getenv('MAX_SESSIONS', '10000'))
        
        # TTL настройки
        self.token_ttl = int(os.getenv('TOKEN_TTL', '3600'))  # 1 час
        self.session_timeout = int(os.getenv('SESSION_TIMEOUT', '7200'))  # 2 часа
        
        # Безопасность
        self.security_level = os.getenv('SECURITY_LEVEL', 'MAXIMUM')
        self.refresh_threshold = int(os.getenv('REFRESH_THRESHOLD', '300'))  # 5 минут
        
        # Окружение
        self.environment = os.getenv('ENVIRONMENT', 'development')
        
        # Автоматические задачи
        self.auto_cleanup_interval = int(os.getenv('AUTO_CLEANUP_INTERVAL', '300'))
        
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == 'production'
    
    @property
    def is_development(self) -> bool:
        return self.environment.lower() == 'development'
    
    @property
    def is_test(self) -> bool:
        return self.environment.lower() == 'test'

# Обновление основной конфигурации
class Config:
    def __init__(self):
        # Существующие настройки...
        self.cache = CacheConfig()
```

## Мониторинг и логирование

### Настройка логирования для кэша

```python
# logging_config.py - дополнения

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'detailed': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        },
        'cache_specific': {
            'format': '%(asctime)s - CACHE - %(levelname)s - %(message)s'
        }
    },
    'handlers': {
        'cache_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/cache.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'cache_specific',
            'level': 'DEBUG'
        },
        'security_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/security.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'detailed',
            'level': 'WARNING'
        }
    },
    'loggers': {
        'cache.oauth_cache': {
            'handlers': ['cache_file'],
            'level': 'DEBUG',
            'propagate': False
        },
        'cache.security': {
            'handlers': ['security_file'],
            'level': 'WARNING',
            'propagate': False
        }
    }
}
```

### Метрики для мониторинга

```python
# monitoring/cache_metrics.py

from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

class CacheMetrics:
    """Метрики для мониторинга кэша."""
    
    def __init__(self):
        # Счетчики
        self.token_operations = Counter(
            'cache_token_operations_total',
            'Общее количество операций с токенами',
            ['operation', 'result']
        )
        
        self.session_operations = Counter(
            'cache_session_operations_total',
            'Общее количество операций с сессиями',
            ['operation', 'result']
        )
        
        # Гистограммы
        self.operation_duration = Histogram(
            'cache_operation_duration_seconds',
            'Время выполнения операций кэша',
            ['operation_type']
        )
        
        # Датчики
        self.active_tokens = Gauge(
            'cache_active_tokens',
            'Количество активных токенов в кэше'
        )
        
        self.active_sessions = Gauge(
            'cache_active_sessions',
            'Количество активных сессий'
        )
        
        self.cache_hit_rate = Gauge(
            'cache_hit_rate_percent',
            'Процент попаданий в кэш'
        )
    
    def record_token_operation(self, operation: str, duration: float, success: bool):
        """Запись метрики операции с токеном."""
        result = 'success' if success else 'error'
        self.token_operations.labels(operation=operation, result=result).inc()
        self.operation_duration.labels(operation_type=f'token_{operation}').observe(duration)
    
    def update_cache_stats(self, active_tokens: int, active_sessions: int, hit_rate: float):
        """Обновление метрик кэша."""
        self.active_tokens.set(active_tokens)
        self.active_sessions.set(active_sessions)
        self.cache_hit_rate.set(hit_rate)

# Инициализация метрик
cache_metrics = CacheMetrics()

def start_metrics_server(port=8000):
    """Запуск сервера метрик."""
    start_http_server(port)
    print(f"Метрики доступны на http://localhost:{port}")

# Интеграция метрик в кэш-менеджер
class MonitoredOAuthCacheManager(OAuthCacheManager):
    """Кэш-менеджер с метриками."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.metrics = cache_metrics
    
    async def store_oauth_token(self, *args, **kwargs):
        """Сохранение токена с записью метрик."""
        start_time = time.time()
        try:
            result = await super().store_oauth_token(*args, **kwargs)
            duration = time.time() - start_time
            self.metrics.record_token_operation('store', duration, result)
            return result
        except Exception as e:
            duration = time.time() - start_time
            self.metrics.record_token_operation('store', duration, False)
            raise
    
    async def get_oauth_token(self, *args, **kwargs):
        """Получение токена с записью метрик."""
        start_time = time.time()
        try:
            result = await super().get_oauth_token(*args, **kwargs)
            duration = time.time() - start_time
            success = result is not None
            self.metrics.record_token_operation('retrieve', duration, success)
            return result
        except Exception as e:
            duration = time.time() - start_time
            self.metrics.record_token_operation('retrieve', duration, False)
            raise
```

## Миграция данных

### Скрипт миграции существующих токенов

```python
# migration/migrate_existing_tokens.py

import asyncio
import logging
from datetime import datetime

from cache import OAuthCacheManager, OAuthCacheFactory
from auth.oauth2 import OAuth2Store

logger = logging.getLogger(__name__)

async def migrate_existing_tokens(oauth_store: OAuth2Store, cache_manager: OAuthCacheManager):
    """
    Миграция существующих токенов из OAuth2Store в кэш.
    
    Args:
        oauth_store: Существующее хранилище OAuth2
        cache_manager: Менеджер кэша
    """
    logger.info("Начало миграции существующих токенов")
    
    migrated_count = 0
    error_count = 0
    
    try:
        # Миграция access токенов
        for access_token, token_data in oauth_store.access_tokens.items():
            try:
                # Проверяем что токен не истек
                if token_data.exp > datetime.now():
                    user_id = f"migrated_user_{token_data.login}"
                    
                    await cache_manager.store_oauth_token(
                        user_id=user_id,
                        access_token=access_token,
                        token_type="Bearer",
                        expires_in=int((token_data.exp - datetime.now()).total_seconds()),
                        user_data={
                            "migrated": True,
                            "original_login": token_data.login,
                            "migration_date": datetime.now().isoformat()
                        }
                    )
                    
                    migrated_count += 1
                    logger.debug(f"Мигрирован токен для пользователя {token_data.login}")
                else:
                    logger.info(f"Пропущен истекший токен для {token_data.login}")
                    
            except Exception as e:
                error_count += 1
                logger.error(f"Ошибка миграции токена {access_token[:16]}...: {e}")
        
        # Миграция refresh токенов
        refresh_migrated = 0
        for refresh_token, refresh_data in oauth_store.refresh_tokens.items():
            try:
                if refresh_data.exp > datetime.now():
                    # Находим соответствующий access токен
                    # В реальной реализации здесь была бы логика связи
                    user_id = f"migrated_user_{refresh_data.login}"
                    
                    await cache_manager.store_oauth_token(
                        user_id=user_id,
                        access_token=f"migrated_access_{refresh_token[:16]}",
                        refresh_token=refresh_token,
                        token_type="Bearer",
                        expires_in=int((refresh_data.exp - datetime.now()).total_seconds()),
                        user_data={
                            "migrated": True,
                            "original_login": refresh_data.login,
                            "migration_date": datetime.now().isoformat(),
                            "is_refresh_token": True
                        }
                    )
                    
                    refresh_migrated += 1
                    
            except Exception as e:
                error_count += 1
                logger.error(f"Ошибка миграции refresh токена {refresh_token[:16]}...: {e}")
        
        logger.info(f"Миграция завершена. Мигрировано: {migrated_count} access токенов, "
                   f"{refresh_migrated} refresh токенов. Ошибок: {error_count}")
        
        return {
            "migrated_access_tokens": migrated_count,
            "migrated_refresh_tokens": refresh_migrated,
            "errors": error_count,
            "migration_date": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Критическая ошибка миграции: {e}")
        raise

# Пример запуска миграции
async def run_migration():
    """Запуск миграции."""
    try:
        # Инициализируем компоненты
        oauth_store = OAuth2Store()
        cache_manager = OAuthCacheFactory.create_production_cache()
        
        await cache_manager.initialize()
        
        try:
            # Выполняем миграцию
            result = await migrate_existing_tokens(oauth_store, cache_manager)
            
            print("Результат миграции:")
            for key, value in result.items():
                print(f"  {key}: {value}")
            
        finally:
            await cache_manager.shutdown()
            
    except Exception as e:
        logger.error(f"Ошибка запуска миграции: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(run_migration())
```

## Тестирование интеграции

### Интеграционные тесты

```python
# tests/test_integration.py

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

from cache import OAuthCacheManager, OAuthCacheFactory
from auth.oauth2 import OAuth2Store, OAuth2Service
from http_server import HTTPServerWithCache

class TestIntegration:
    """Интеграционные тесты."""
    
    @pytest.fixture
    async def integrated_setup(self):
        """Фикстура для интеграционного тестирования."""
        # Создаем компоненты
        cache_manager = OAuthCacheFactory.create_test_cache()
        await cache_manager.initialize()
        
        oauth_store = OAuth2Store()
        oauth_service = OAuth2Service(oauth_store)
        
        http_server = HTTPServerWithCache(cache_manager)
        
        yield {
            'cache_manager': cache_manager,
            'oauth_store': oauth_store,
            'oauth_service': oauth_service,
            'http_server': http_server
        }
        
        await cache_manager.shutdown()
    
    async def test_full_oauth_flow(self, integrated_setup):
        """Тест полного OAuth потока с кэшированием."""
        components = integrated_setup
        
        # 1. Авторизация
        auth_code = components['oauth_service'].generate_authorization_code(
            login="test_user",
            password="test_password",
            redirect_uri="https://example.com/callback",
            code_challenge="test_challenge"
        )
        
        assert auth_code is not None
        
        # 2. Обмен кода на токены
        tokens_data = components['oauth_service'].exchange_code_for_tokens(
            code=auth_code,
            redirect_uri="https://example.com/callback",
            code_verifier="test_verifier"
        )
        
        assert tokens_data is not None
        access_token, token_type, expires_in, refresh_token = tokens_data
        
        # 3. Кэширование токенов
        cache_result = await components['cache_manager'].store_oauth_token(
            user_id="test_user",
            access_token=access_token,
            refresh_token=refresh_token,
            token_type=token_type,
            expires_in=expires_in
        )
        
        assert cache_result == True
        
        # 4. Валидация через кэш
        validation = await components['cache_manager'].validate_access_token(access_token)
        assert validation is not None
        assert validation["valid"] == True
        
        # 5. Получение статистики
        stats = await components['cache_manager'].get_comprehensive_stats()
        assert stats["summary"]["total_active_tokens"] == 1
    
    async def test_http_protected_endpoint(self, integrated_setup):
        """Тест защищенного HTTP эндпоинта."""
        components = integrated_setup
        
        # Добавляем тестовый токен
        await components['cache_manager'].store_oauth_token(
            user_id="http_test_user",
            access_token="http_test_token",
            expires_in=3600
        )
        
        # Создаем тестовый запрос
        from aiohttp import web
        from aiohttp.test_utils import TestClient, TestServer
        
        async def test_handler(request):
            user_info = request.get('user')
            if not user_info:
                return web.Response(status=401, text="Unauthorized")
            return web.json_response({"message": "Success", "user": user_info})
        
        # Добавляем обработчик
        components['http_server'].app.router.add_get('/test', test_handler)
        
        # Создаем тестовый клиент
        async with TestClient(TestServer(components['http_server'].app)) as client:
            # Тест без токена
            response = await client.get('/test')
            assert response.status == 401
            
            # Тест с недействительным токеном
            response = await client.get('/test', headers={'Authorization': 'Bearer invalid_token'})
            assert response.status == 401
            
            # Тест с действительным токеном
            response = await client.get('/test', headers={'Authorization': 'Bearer http_test_token'})
            assert response.status == 200
            
            data = await response.json()
            assert data["message"] == "Success"

# Запуск интеграционных тестов
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Заключение

Интеграция модуля OAuth Cache с 1C MCP сервером обеспечивает:

1. **Повышенную безопасность** - шифрование токенов и контроль доступа
2. **Улучшенную производительность** - эффективное кэширование и оптимизация запросов
3. **Надежность** - автоматическая очистка и обработка ошибок
4. **Мониторинг** - детальная статистика и метрики
5. **Масштабируемость** - поддержка больших нагрузок

Все изменения являются обратно совместимыми и не нарушают существующую функциональность сервера.