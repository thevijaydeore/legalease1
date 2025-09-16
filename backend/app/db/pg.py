"""PostgreSQL connection utilities for vector search queries using pgvector."""
from contextlib import contextmanager
from functools import lru_cache

import psycopg2
from psycopg2.extras import RealDictCursor

from ..core.config import settings


@lru_cache(maxsize=1)
def _get_dsn() -> str:
    return settings.database_url


@contextmanager
def get_conn():
    conn = psycopg2.connect(_get_dsn(), cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()
