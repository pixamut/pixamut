from typing import Any

import secrets
from pydantic import EmailStr, ValidationInfo, field_validator
from pydantic_settings import BaseSettings
from pathlib import Path

env_file = str(Path(__file__).resolve().parent.parent.parent.parent / ".env")


class Settings(BaseSettings):
    ENV: str = "dev"
    VITE_ENV: str = "dev"
    PROJECT_NAME: str = "Dread"
    API_PREFIX: str = "/api/v1"
    BACKEND_BASE_URL: str = "http://localhost"
    VITE_BACKEND_BASE_URL: str = "http://localhost"
    BACKEND_PORT: str = "8000"
    STAKE_FRONT_BASE_URL: str = "http://localhost"
    STAKE_FRONT_PORT: str = "5472"

    RPC_URL: str = ""

    HUGGINGFACE_KEY: str = ""
    OPENAI_KEY: str = ""

    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 14
    REFRESH_SECRET_KEY: str = secrets.token_urlsafe(32)

    GOOGLE_AUTH_URL: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    GITHUB_AUTH_URL: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    CORS_ORIGINS: list[str] | str = []

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    DB_DRIVER: str = "postgresql+asyncpg"
    DB_HOST: str | None = None
    DB_PORT: str | None = None
    DB_USER: str | None = None
    DB_PASSWORD: str | None = None
    DB_NAME: str | None = None
    DB_URL: str = ""

    @field_validator("DB_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None, info: ValidationInfo) -> str:
        if isinstance(v, str) and len(v) > 0:
            return v
        scheme = info.data.get("DB_DRIVER")
        host = info.data.get("DB_HOST")
        port = info.data.get("DB_PORT")
        user = info.data.get("DB_USER")
        password = info.data.get("DB_PASSWORD")
        db = info.data.get("DB_NAME")
        return f"{scheme}://{user}:{password}@{host}:{port}/{db}"

    EMAIL_TLS: bool = True
    EMAIL_HOST: str = ""
    EMAIL_PORT: int = 0
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM_EMAIL: EmailStr = "todo@todo.com"
    EMAIL_FROM_NAME: str = ""

    @field_validator("EMAIL_FROM_NAME")
    @classmethod
    def assemble_email_from_name(cls, v: str | None, info: ValidationInfo) -> str:
        if not v:
            return str(info.data.get("PROJECT_NAME"))
        return v

    EMAIL_RESET_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    EMAIL_TEMPLATE_DIR: str = "/app/app/email-templates/build"
    EMAIL_ENABLED: bool = False

    @field_validator("EMAIL_ENABLED", mode="before")
    @classmethod
    def assemble_email_enabled(cls, v: bool, info: ValidationInfo) -> bool:
        return bool(
            v
            and info.data.get("EMAIL_HOST")
            and info.data.get("EMAIL_PORT")
            and info.data.get("EMAIL_FROM_EMAIL")
        )

    TOKEN_ADDRESS: str = ""
    PIXEL_STAKING_ADDRESS: str = ""
    PROJECT_FACTORY_ADDRESS: str = ""

    ADMIN_PRIVATE_KEY: str = ""
    ADMIN_ADDRESS: str = ""

    class Config:
        # env_file = str(Path(__file__).resolve().parent.parent.parent.parent / ".env")
        case_sensitive = True


config = Settings()
