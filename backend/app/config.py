from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Railway injects DATABASE_URL via Postgres plugin
    database_url: str | None = None
    # Local fallback
    _local_db_url: str = "postgresql://phone_user:phone_pass@localhost:5432/phone_store"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    store_lat: float = 10.762622
    store_lng: float = 106.660172
    store_name: str = "Phone Store HQ"
    admin_email: str = "admin@phone-store.com"
    admin_password: str = "admin123"
    cors_origins: str = "https://cellzone.site,https://du-an-poly.vercel.app,https://du-an-poly-production.up.railway.app,http://localhost:5173,http://localhost:5174,http://localhost:8081,exp://,exp://localhost:8081"
    upload_dir: str = "/data/uploads"
    resend_api_key: str = ""
    email_from: str = "Phone Store <onboarding@resend.dev>"
    # Optional: enables the live-chat AI agent in backend/app/services/ai_agent.py.
    # Leave empty in local development — the agent will then issue a friendly
    # canned reply instead of calling Gemini. The value is read from the
    # ``GEMINI_API_KEY`` environment variable; never hard-code a real key here.
    gemini_api_key: str = ""
    # How long chat conversations + messages are kept before the
    # retention middleware hard-deletes them. Default 4 days — long
    # enough that any support follow-up can still read history, short
    # enough to keep the chat_messages table from growing without
    # bound. Set to 0 to disable chat retention entirely. Override
    # via the ``CHAT_RETENTION_DAYS`` env var.
    chat_retention_days: int = 4
    # Master switch for the retention middleware itself. Default True.
    # Set ``RETENTION_ENABLED=false`` on Railway to disable in case
    # retention needs to be paused for a migration or incident.
    retention_enabled: bool = True

    @property
    def database_url_final(self) -> str:
        import os
        return os.environ.get("DATABASE_URL") or self._local_db_url

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
