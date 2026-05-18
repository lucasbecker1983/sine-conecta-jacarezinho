from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "SINE Conecta Jacarezinho"
    app_env: str = "development"
    app_domain: str = "sine.jacarezinho.cloud"
    app_url: str = "https://sine.jacarezinho.cloud"
    database_url: str
    jwt_secret: str
    jwt_refresh_secret: str | None = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    backend_host: str = "127.0.0.1"
    backend_port: int = 18743
    upload_dir: Path = Field(default=ROOT_DIR / "uploads")
    log_dir: Path = Field(default=ROOT_DIR / "logs")
    tenant_default_slug: str = "jacarezinho"
    cors_origins: str = "https://sine.jacarezinho.cloud,http://localhost:5173"
    max_resume_size_mb: int = 20

    @property
    def allowed_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def refresh_secret(self) -> str:
        return self.jwt_refresh_secret or self.jwt_secret


@lru_cache
def get_settings() -> Settings:
    return Settings()
