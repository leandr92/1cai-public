"""
Database Connection Pool Management
"""

import asyncpg
import asyncio
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Global pool instance
_pool: Optional[asyncpg.Pool] = None


async def create_pool(max_retries: int = 3, retry_delay: int = 5) -> asyncpg.Pool:
    """
    Create database connection pool with retry logic
    
    Args:
        max_retries: Maximum number of retry attempts
        retry_delay: Delay between retries in seconds
    """
    global _pool
    
    if _pool is None:
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/enterprise_1c_ai')
        
        logger.info(f"Creating database pool...")
        
        for attempt in range(max_retries):
            try:
                _pool = await asyncpg.create_pool(
                    database_url,
                    min_size=5,
                    max_size=20,
                    command_timeout=60,
                    timeout=30
                )
                logger.info("✅ Database pool created successfully")
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(
                        f"⚠️ Failed to create database pool (attempt {attempt + 1}/{max_retries}): {e}"
                    )
                    logger.info(f"   Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                else:
                    logger.error(f"❌ Failed to create database pool after {max_retries} attempts: {e}")
                    raise
    
    return _pool


async def close_pool():
    """Close database connection pool"""
    global _pool
    
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Database pool closed")


def get_pool() -> asyncpg.Pool:
    """
    Get database pool for dependency injection
    
    Returns:
        asyncpg.Pool: Database connection pool
        
    Raises:
        RuntimeError: If pool not initialized
    """
    if _pool is None:
        raise RuntimeError(
            "Database pool not initialized. "
            "Call create_pool() during application startup."
        )
    
    return _pool


# Convenience function for FastAPI dependency
def get_db_pool() -> asyncpg.Pool:
    """
    FastAPI dependency для получения database pool
    
    Usage:
        @router.get("/endpoint")
        async def endpoint(db_pool: asyncpg.Pool = Depends(get_db_pool)):
            async with db_pool.acquire() as conn:
                # Use connection
                pass
    """
    return get_pool()

