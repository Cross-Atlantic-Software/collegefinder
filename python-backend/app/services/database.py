"""
PostgreSQL Database Service
Provides async PostgreSQL connection using asyncpg.
"""
import asyncpg
from typing import Optional
from contextlib import asynccontextmanager

from app.config import settings


class Database:
    """PostgreSQL database connection manager using asyncpg connection pool."""
    
    pool: Optional[asyncpg.Pool] = None
    
    @classmethod
    async def connect(cls):
        """Initialize PostgreSQL connection pool."""
        cls.pool = await asyncpg.create_pool(
            host=settings.db_host,
            port=settings.db_port,
            database=settings.db_name,
            user=settings.db_user,
            password=settings.db_password,
            min_size=settings.db_min_pool_size,
            max_size=settings.db_max_pool_size,
        )
        print(f"✅ Connected to PostgreSQL: {settings.db_name}@{settings.db_host}:{settings.db_port}")
    
    @classmethod
    async def disconnect(cls):
        """Close PostgreSQL connection pool."""
        if cls.pool:
            await cls.pool.close()
            print("❌ Disconnected from PostgreSQL")
    
    @classmethod
    def get_pool(cls) -> asyncpg.Pool:
        """Get connection pool instance."""
        if not cls.pool:
            raise RuntimeError("Database not connected. Call connect() first.")
        return cls.pool
    
    @classmethod
    @asynccontextmanager
    async def connection(cls):
        """Context manager for acquiring a connection from the pool."""
        async with cls.get_pool().acquire() as conn:
            yield conn
    
    @classmethod
    @asynccontextmanager
    async def transaction(cls):
        """Context manager for database transaction."""
        async with cls.connection() as conn:
            async with conn.transaction():
                yield conn


# Convenience functions

async def get_db() -> asyncpg.Pool:
    """FastAPI dependency for database access."""
    return Database.get_pool()


async def fetch_one(query: str, *args) -> Optional[dict]:
    """Execute query and fetch one row as dict."""
    async with Database.connection() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def fetch_all(query: str, *args) -> list[dict]:
    """Execute query and fetch all rows as list of dicts."""
    async with Database.connection() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]


async def execute(query: str, *args) -> str:
    """Execute query and return status."""
    async with Database.connection() as conn:
        return await conn.execute(query, *args)


async def execute_many(query: str, args_list: list) -> None:
    """Execute query with multiple argument sets."""
    async with Database.connection() as conn:
        await conn.executemany(query, args_list)
