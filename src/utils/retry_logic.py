"""
Retry Logic with Exponential Backoff
TIER 1 Improvement: Auto-recovery from transient failures
"""

import logging
import asyncio
import time
from typing import Callable, Any, Type, Tuple
from functools import wraps

logger = logging.getLogger(__name__)


async def retry_async(
    func: Callable,
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    *args,
    **kwargs
) -> Any:
    """
    Retry async function with exponential backoff
    
    Args:
        func: Async function to retry
        max_attempts: Maximum retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential backoff (2 = double each time)
        exceptions: Tuple of exceptions to catch and retry
    
    Returns:
        Result of function call
    
    Raises:
        Last exception if all retries fail
    """
    
    last_exception = None
    
    for attempt in range(max_attempts):
        try:
            # Execute function
            result = await func(*args, **kwargs)
            
            # Success!
            if attempt > 0:
                logger.info(f"✅ {func.__name__} succeeded on attempt {attempt + 1}/{max_attempts}")
            
            return result
            
        except exceptions as e:
            last_exception = e
            
            # Last attempt, don't retry
            if attempt == max_attempts - 1:
                logger.error(
                    f"❌ {func.__name__} failed after {max_attempts} attempts: {e}"
                )
                break
            
            # Calculate backoff delay
            delay = min(
                initial_delay * (exponential_base ** attempt),
                max_delay
            )
            
            logger.warning(
                f"⚠️ {func.__name__} failed (attempt {attempt + 1}/{max_attempts}): {e}. "
                f"Retrying in {delay:.1f}s..."
            )
            
            # Wait before retry
            await asyncio.sleep(delay)
    
    # All retries failed
    raise last_exception


# Decorator version
def with_retry(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,)
):
    """
    Decorator to add retry logic to async functions
    
    Usage:
        @with_retry(max_attempts=3, initial_delay=1.0)
        async def query_database(query: str):
            # Database query
            pass
    """
    
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await retry_async(
                func,
                max_attempts=max_attempts,
                initial_delay=initial_delay,
                max_delay=max_delay,
                exponential_base=exponential_base,
                exceptions=exceptions,
                *args,
                **kwargs
            )
        
        return wrapper
    
    return decorator


# Jittered retry (prevents thundering herd)
async def retry_with_jitter(
    func: Callable,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    *args,
    **kwargs
) -> Any:
    """
    Retry with jittered exponential backoff
    
    Adds randomness to prevent all clients retrying simultaneously
    """
    import random
    
    for attempt in range(max_attempts):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            if attempt == max_attempts - 1:
                raise
            
            # Exponential backoff with jitter
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            
            logger.warning(f"Retry {attempt + 1}/{max_attempts} after {delay:.2f}s: {e}")
            await asyncio.sleep(delay)


# Example usage:
"""
from src.utils.retry_logic import with_retry

# Database queries
@with_retry(max_attempts=3, initial_delay=0.5)
async def query_db(sql: str):
    async with db_pool.acquire() as conn:
        return await conn.fetch(sql)

# External API calls
@with_retry(
    max_attempts=5,
    initial_delay=2.0,
    exceptions=(httpx.HTTPError, asyncio.TimeoutError)
)
async def call_openai(prompt: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(...)
        return response.json()

# Redis operations
@with_retry(max_attempts=2, initial_delay=0.1)
async def get_from_cache(key: str):
    return await redis_client.get(key)
"""


