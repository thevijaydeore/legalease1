"""Singleton wrapper around supabase-py client so it can be imported anywhere."""
from functools import lru_cache

from supabase import create_client, Client

from ..core.config import settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Return a cached Supabase client instance (singleton)."""
    return create_client(settings.supabase_url, settings.supabase_anon_key)
