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
    cors_origins: str = "http://localhost:5173,http://localhost:8081,exp://,exp://localhost:8081"
    upload_dir: str = "/data/uploads"
    resend_api_key: str = ""
    email_from: str = "Phone Store <onboarding@resend.dev>"

    @property
    def database_url_final(self) -> str:
        import os
        return os.environ.get("DATABASE_URL") or self._local_db_url

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
