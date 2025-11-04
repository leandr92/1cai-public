"""
Сервис кэширования для Code Review и других сервисов
Версия: 1.0.0
"""

import hashlib
import json
from typing import Optional, Any
from datetime import datetime, timedelta
from functools import wraps
import redis.asyncio as aioredis
from src.config import settings

# In-memory кэш для fallback (если Redis недоступен)
memory_cache: dict = {}
memory_cache_ttl: dict = {}


class CacheService:
    """Сервис кэширования результатов"""
    
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.use_redis = False
        self._init_redis()
    
    def _init_redis(self):
        """Инициализация Redis клиента (синхронная инициализация)"""
        # Redis инициализируется асинхронно при первом использовании
        self.use_redis = False
    
    async def _ensure_redis(self):
        """Обеспечение наличия Redis соединения"""
        if not self.use_redis and not self.redis_client:
            try:
                self.redis_client = aioredis.from_url(
                    settings.redis_url,
                    socket_connect_timeout=2,
                    decode_responses=True
                )
                # Проверка соединения
                await self.redis_client.ping()
                self.use_redis = True
            except Exception as e:
                print(f"Redis недоступен, используется in-memory кэш: {e}")
                self.use_redis = False
                if self.redis_client:
                    try:
                        await self.redis_client.close()
                    except:
                        pass
                    self.redis_client = None
    
    async def get(self, key: str) -> Optional[Any]:
        """Получение значения из кэша"""
        await self._ensure_redis()
        
        if self.use_redis and self.redis_client:
            try:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                print(f"Ошибка чтения из Redis: {e}")
                # Fallback на memory cache
        
        # In-memory fallback
        if key in memory_cache:
            if key in memory_cache_ttl:
                if datetime.now() < memory_cache_ttl[key]:
                    return memory_cache[key]
                else:
                    # TTL истек
                    del memory_cache[key]
                    del memory_cache_ttl[key]
            else:
                return memory_cache[key]
        
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Сохранение значения в кэш"""
        await self._ensure_redis()
        
        serialized = json.dumps(value, default=str)
        
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.setex(key, ttl, serialized)
                return
            except Exception as e:
                print(f"Ошибка записи в Redis: {e}")
                # Fallback на memory cache
        
        # In-memory fallback
        memory_cache[key] = value
        memory_cache_ttl[key] = datetime.now() + timedelta(seconds=ttl)
    
    async def delete(self, key: str):
        """Удаление значения из кэша"""
        await self._ensure_redis()
        
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception as e:
                print(f"Ошибка удаления из Redis: {e}")
        
        # In-memory fallback
        if key in memory_cache:
            del memory_cache[key]
        if key in memory_cache_ttl:
            del memory_cache_ttl[key]
    
    async def clear_pattern(self, pattern: str):
        """Очистка кэша по паттерну"""
        await self._ensure_redis()
        
        if self.use_redis and self.redis_client:
            try:
                keys = await self.redis_client.keys(pattern)
                if keys:
                    await self.redis_client.delete(*keys)
            except Exception as e:
                print(f"Ошибка очистки Redis: {e}")
        
        # In-memory fallback
        keys_to_delete = [k for k in memory_cache.keys() if pattern.replace('*', '') in k]
        for key in keys_to_delete:
            if key in memory_cache:
                del memory_cache[key]
            if key in memory_cache_ttl:
                del memory_cache_ttl[key]
    
    def generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Генерация ключа кэша"""
        key_data = f"{prefix}:{json.dumps(args, default=str)}:{json.dumps(kwargs, sort_keys=True, default=str)}"
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"{prefix}:{key_hash}"


# Глобальный экземпляр
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Получение экземпляра сервиса кэширования"""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service


# ==================== ДЕКОРАТОРЫ ДЛЯ КЭШИРОВАНИЯ ====================

def cache_result(ttl: int = 3600, key_prefix: str = "cache"):
    """Декоратор для кэширования результатов функции"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            cache_service = get_cache_service()
            
            # Генерация ключа
            cache_key = cache_service.generate_key(
                f"{key_prefix}:{func.__name__}",
                *args,
                **kwargs
            )
            
            # Попытка получить из кэша
            cached = await cache_service.get(cache_key)
            if cached is not None:
                return cached
            
            # Выполнение функции
            result = await func(*args, **kwargs)
            
            # Сохранение в кэш
            await cache_service.set(cache_key, result, ttl)
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            cache_service = get_cache_service()
            
            # Генерация ключа
            cache_key = cache_service.generate_key(
                f"{key_prefix}:{func.__name__}",
                *args,
                **kwargs
            )
            
            # Для синхронных функций используем синхронный вызов
            # (упрощенная версия)
            if cache_key in memory_cache:
                return memory_cache[cache_key]
            
            result = func(*args, **kwargs)
            memory_cache[cache_key] = result
            memory_cache_ttl[cache_key] = datetime.now() + timedelta(seconds=ttl)
            
            return result
        
        # Возвращаем async или sync wrapper в зависимости от типа функции
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

