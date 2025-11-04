# OAuth Cache Module

Модуль кэширования OAuth2 токенов и сессий для 1C MCP сервера, реализованный с учетом современных стандартов безопасности.

## Обзор

Модуль предоставляет комплексное решение для кэширования OAuth2 токенов и управления пользовательскими сессиями с следующими возможностями:

- 🔐 **Безопасное хранение** - шифрование чувствительных данных
- ⚡ **Высокая производительность** - эффективные алгоритмы кэширования (LRU/LFU)
- 🧹 **Автоматическая очистка** - удаление истекших токенов и сессий
- 🔄 **Интеграция** - совместимость с существующим OAuth2 модулем
- 📊 **Мониторинг** - подробная статистика и метрики
- 🛡️ **Защита от атак** - rate limiting и контроль доступа

## Архитектура

### Основные компоненты

```
OAuthCacheManager (главный менеджер)
├── SecureStorage (безопасное хранилище)
├── OAuthTokenCache (кэш токенов)
├── SessionManager (управление сессиями)
└── TokenValidator (валидация токенов)
```

### Классы модуля

#### SecureStorage
Безопасное хранилище с возможностями:
- Шифрование данных с использованием Fernet (AES 128)
- Хеширование секретов через PBKDF2
- Защита от brute force атак
- Rate limiting с автоматической блокировкой
- Мониторинг попыток доступа

```python
from cache import SecureStorage, SecurityLevel

# Создание безопасного хранилища
storage = SecureStorage(
    security_level=SecurityLevel.MAXIMUM
)

# Шифрование данных
encrypted = storage.encrypt("sensitive_data")
decrypted = storage.decrypt(encrypted)

# Хеширование
hash_value = storage.hash_secret("my_secret")
```

#### OAuthTokenCache
Кэш для OAuth2 токенов с функциями:
- Кэширование access и refresh токенов
- Автоматическая очистка по TTL
- Стратегии вытеснения (LRU/LFU)
- Поиск по пользователям
- Статистика использования

```python
from cache import OAuthTokenCache, CacheStrategy

# Создание кэша токенов
token_cache = OAuthTokenCache(
    max_size=1000,
    default_ttl=3600,
    strategy=CacheStrategy.LRU
)

# Сохранение токена
await token_cache.store_token(
    user_id="user123",
    access_token="access_token_value",
    refresh_token="refresh_token_value",
    expires_in=3600
)

# Получение токена
token = await token_cache.get_token("access_token_value")
```

#### SessionManager
Управление пользовательскими сессиями:
- Создание и отслеживание сессий
- Контроль одновременных сессий пользователя
- Автоматическая очистка неактивных сессий
- Метаданные сессий
- Статистика активности

```python
from cache import SessionManager

# Создание менеджера сессий
session_manager = SessionManager(
    max_sessions=10000,
    session_timeout=3600,
    max_concurrent_sessions=5
)

# Создание сессии
session_id = await session_manager.create_session(
    user_identifier="user123",
    login="john_doe",
    metadata={"role": "admin"}
)
```

#### TokenValidator
Валидация токенов и сессий:
- Проверка валидности токенов
- Автоматическое обновление истекших токенов
- Интеграция с кэшем токенов и менеджером сессий
- Метрики валидации

```python
from cache import TokenValidator

# Создание валидатора
validator = TokenValidator(
    token_cache=token_cache,
    session_manager=session_manager,
    refresh_threshold=300,  # 5 минут
    auto_refresh=True
)

# Валидация токена
result = await validator.validate_token("access_token")
if result:
    print(f"Токен валиден, истекает через {result['expires_in']} секунд")
```

#### OAuthCacheManager
Главный менеджер, объединяющий все компоненты:
- Единый интерфейс для всех операций
- Автоматическое управление жизненным циклом
- Фоновые задачи очистки
- Комплексная статистика

```python
from cache import OAuthCacheManager

# Создание менеджера кэша
cache_manager = OAuthCacheManager(
    max_token_cache_size=1000,
    max_sessions=10000,
    token_ttl=3600,
    auto_start_tasks=True
)

# Использование
await cache_manager.initialize()

# Сохранение токена
await cache_manager.store_oauth_token(
    user_id="user123",
    access_token="access_token",
    refresh_token="refresh_token"
)

# Валидация
validation = await cache_manager.validate_access_token("access_token")

# Завершение работы
await cache_manager.shutdown()
```

## Установка и настройка

### Требования

```
cryptography>=3.4.8
asyncio
typing-extensions
```

### Конфигурация по окружениям

#### Production
```python
from cache import OAuthCacheFactory

cache_manager = OAuthCacheFactory.create_production_cache(
    max_tokens=5000,
    max_sessions=50000
)
```

#### Development
```python
cache_manager = OAuthCacheFactory.create_development_cache(
    max_tokens=100,
    max_sessions=1000
)
```

#### Testing
```python
cache_manager = OAuthCacheFactory.create_test_cache(
    max_tokens=50,
    max_sessions=100
)
```

### Параметры конфигурации

| Параметр | Type | Default | Description |
|----------|------|---------|-------------|
| `max_token_cache_size` | int | 1000 | Максимальное количество токенов в кэше |
| `max_sessions` | int | 10000 | Максимальное количество сессий |
| `token_ttl` | int | 3600 | Время жизни токенов в секундах |
| `session_timeout` | int | 3600 | Таймаут сессий в секундах |
| `security_level` | SecurityLevel | MAXIMUM | Уровень безопасности |
| `refresh_threshold` | int | 300 | Порог обновления токенов в секундах |

## Интеграция с существующим OAuth2 модулем

Модуль полностью совместим с существующим `auth.oauth2`:

```python
from cache import OAuthCacheManager
from auth.oauth2 import OAuth2Service, OAuth2Store

# Создание интегрированного сервиса
oauth_store = OAuth2Store()
oauth_service = OAuth2Service(oauth_store)
cache_manager = OAuthCacheManager()

# Авторизация с кэшированием
auth_code = oauth_service.generate_authorization_code(
    login="user",
    password="password",
    redirect_uri="https://example.com/callback",
    code_challenge="challenge"
)

# Обмен кода на токены с кэшированием
tokens = oauth_service.exchange_code_for_tokens(auth_code, "https://example.com/callback", "verifier")

if tokens:
    access_token, token_type, expires_in, refresh_token = tokens
    await cache_manager.store_oauth_token(
        user_id="user123",
        access_token=access_token,
        refresh_token=refresh_token,
        token_type=token_type,
        expires_in=expires_in
    )
```

## Безопасность

### Уровни безопасности

- **BASIC**: Минимальная защита (50,000 итераций PBKDF2)
- **ENHANCED**: Усиленная защита (75,000 итераций PBKDF2)
- **MAXIMUM**: Максимальная защита (100,000 итераций PBKDF2)

### Защитные механизмы

1. **Шифрование данных**:
   - AES-128 для шифрования токенов
   - PBKDF2 для генерации ключей шифрования

2. **Rate Limiting**:
   - Ограничение попыток доступа (5 попыток за 5 минут)
   - Автоматическая блокировка подозрительной активности

3. **Безопасное хранение**:
   - Изоляция чувствительных данных
   - Автоматическая очистка памяти

4. **Мониторинг**:
   - Логирование всех операций
   - Статистика безопасности
   - Отслеживание попыток взлома

## Производительность

### Алгоритмы кэширования

- **LRU (Least Recently Used)** - удаляет наименее недавно использованные элементы
- **LFU (Least Frequently Used)** - удаляет наименее часто используемые элементы
- **TTL** - автоматическая очистка по времени жизни

### Оптимизации

- Использование `asyncio.Lock` для потокобезопасности
- Фоновые задачи для автоматической очистки
- Эффективные структуры данных (OrderedDict, defaultdict)
- Минимизация копирования объектов

### Метрики производительности

```python
stats = await cache_manager.get_comprehensive_stats()
print(f"Cache Hit Rate: {stats['cache_stats']['hit_rate']}%")
print(f"Memory Usage: {stats['cache_stats']['memory_usage_mb']} MB")
print(f"Active Sessions: {stats['session_stats']['current_active']}")
```

## Мониторинг и статистика

### Доступные метрики

- **Кэш токенов**:
  - Hit/Miss ratio
  - Количество токенов в кэше
  - Использование памяти
  - Количество вытеснений

- **Сессии пользователей**:
  - Количество активных сессий
  - Количество пользователей
  - Среднее количество сессий на пользователя

- **Безопасность**:
  - Количество попыток доступа
  - Количество неудачных попыток
  - Текущий уровень безопасности

### Пример получения статистики

```python
# Полная статистика
comprehensive_stats = await cache_manager.get_comprehensive_stats()

print("=== Statistics ===")
print(f"Cache Hit Rate: {comprehensive_stats['summary']['cache_hit_rate']}%")
print(f"Active Tokens: {comprehensive_stats['summary']['total_active_tokens']}")
print(f"Active Sessions: {comprehensive_stats['summary']['total_active_sessions']}")
print(f"Security Level: {comprehensive_stats['security']['security_level']}")
```

## Обработка ошибок

### Типы ошибок

1. **ValidationError** - ошибки валидации токенов
2. **SecurityError** - нарушения безопасности
3. **CacheError** - ошибки работы с кэшем
4. **SessionError** - ошибки управления сессиями

### Примеры обработки

```python
try:
    validation = await cache_manager.validate_access_token("token")
    if not validation:
        print("Токен недействителен")
except PermissionError as e:
    print(f"Превышен лимит попыток: {e}")
except Exception as e:
    print(f"Ошибка валидации: {e}")
```

## Лучшие практики

### 1. Безопасность
- Всегда используйте HTTPS для передачи токенов
- Регулярно ротируйте мастер-ключи шифрования
- Мониторьте попытки несанкционированного доступа
- Настройте логирование всех операций с токенами

### 2. Производительность
- Настройте оптимальный размер кэша для вашей нагрузки
- Используйте подходящую стратегию кэширования (LRU/LFU)
- Регулярно мониторьте использование памяти
- Настройте автоматическую очистку

### 3. Надежность
- Реализуйте graceful shutdown для корректного завершения
- Регулярно проверяйте здоровье системы
- Настройте мониторинг метрик
- Тестируйте сценарии отказа

### 4. Интеграция
- Интегрируйте с существующим OAuth2 модулем
- Согласуйте TTL токенов с внешними OAuth серверами
- Обеспечьте синхронизацию между кэшем и базой данных
- Реализуйте graceful degradation при сбоях

## Примеры использования

### Базовое использование

```python
import asyncio
from cache import OAuthCacheManager, SecurityLevel

async def main():
    # Создание кэш-менеджера
    cache_manager = OAuthCacheManager(
        max_token_cache_size=1000,
        security_level=SecurityLevel.MAXIMUM
    )
    
    try:
        await cache_manager.initialize()
        
        # Сохранение токена
        await cache_manager.store_oauth_token(
            user_id="user123",
            access_token="my_access_token",
            refresh_token="my_refresh_token",
            expires_in=3600
        )
        
        # Валидация токена
        validation = await cache_manager.validate_access_token("my_access_token")
        if validation:
            print("Токен валиден!")
            print(f"Истекает через {validation['expires_in']} секунд")
        
    finally:
        await cache_manager.shutdown()

asyncio.run(main())
```

### Интеграция с веб-сервером

```python
from aiohttp import web
from cache import OAuthCacheManager

cache_manager = OAuthCacheManager()

async def validate_token_middleware(request, handler):
    # Извлекаем токен из заголовка
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return web.Response(status=401, text="Токен не предоставлен")
    
    access_token = auth_header[7:]  # Убираем "Bearer "
    
    # Валидируем токен
    validation = await cache_manager.validate_access_token(access_token)
    if not validation:
        return web.Response(status=401, text="Недействительный токен")
    
    # Добавляем информацию о пользователе в request
    request['user'] = validation['user_data']
    return await handler(request)

# Использование middleware
app.middlewares.append(validate_token_middleware)
```

### Мониторинг системы

```python
async def health_check():
    """Проверка здоровья системы кэширования."""
    try:
        stats = await cache_manager.get_comprehensive_stats()
        
        # Проверяем критические метрики
        hit_rate = stats['cache_stats']['hit_rate']
        if hit_rate < 50:
            logger.warning(f"Низкий hit rate: {hit_rate}%")
        
        memory_usage = stats['cache_stats']['memory_usage_mb']
        if memory_usage > 100:  # МБ
            logger.warning(f"Высокое использование памяти: {memory_usage} MB")
        
        active_sessions = stats['session_stats']['current_active']
        if active_sessions > 5000:
            logger.info(f"Высокая нагрузка: {active_sessions} активных сессий")
        
        return True
    except Exception as e:
        logger.error(f"Ошибка проверки здоровья: {e}")
        return False

# Запуск проверки каждую минуту
async def monitoring_loop():
    while True:
        await asyncio.sleep(60)
        await health_check()
```

## Устранение неполадок

### Частые проблемы

1. **Высокое использование памяти**:
   - Уменьшите размер кэша
   - Сократите TTL токенов
   - Увеличьте частоту очистки

2. **Низкий hit rate**:
   - Увеличьте размер кэша
   - Оптимизируйте стратегию кэширования
   - Проверьте TTL настройки

3. **Проблемы безопасности**:
   - Проверьте настройки шифрования
   - Мониторьте попытки доступа
   - Обновите мастер-ключи

### Отладка

```python
# Включение подробного логирования
import logging
logging.basicConfig(level=logging.DEBUG)

# Проверка внутреннего состояния
stats = await cache_manager.get_comprehensive_stats()
print(f"Cache state: {stats}")

# Тестирование отдельных компонентов
token_cache_stats = await cache_manager.token_cache.get_stats()
session_stats = await cache_manager.session_manager.get_stats()
security_stats = cache_manager.secure_storage.get_security_stats()
```

## Лицензия

Модуль разработан для 1C MCP проекта в соответствии со стандартами безопасности 1С:Предприятие.

---

**Версия**: 1.0.0  
**Дата**: 2024-2025