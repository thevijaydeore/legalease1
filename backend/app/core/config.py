from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""

    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(..., env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str | None = Field(None, env="SUPABASE_SERVICE_ROLE_KEY")
    database_url: str = Field(..., env="DATABASE_URL")  # postgresql://user:pass@host:port/dbname

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
