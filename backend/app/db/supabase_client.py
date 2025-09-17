"""Singleton wrapper around supabase-py client so it can be imported anywhere."""
from functools import lru_cache

from supabase import create_client, Client

from ..core.config import settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Return a cached Supabase client instance (singleton).

    Prefer using the service role key when available for server-side operations
    (e.g., Storage writes and DB inserts under RLS). Fallback to anon key otherwise.
    """
    key = settings.supabase_service_role_key or settings.supabase_anon_key
    return create_client(settings.supabase_url, key)
