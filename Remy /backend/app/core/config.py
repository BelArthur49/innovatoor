"""
app/core/config.py
──────────────────
Loads all settings from .env file using pydantic-settings.
Access anywhere with:  from app.core.config import settings
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):

    # ── App ──────────────────────────────────────────────────
    APP_NAME: str = "FlowCash"
    APP_ENV: str = "development"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:8080"

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./flowcash.db"

    # ── Security ─────────────────────────────────────────────
    SECRET_KEY: str = "changeme"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── Business rules ────────────────────────────────────────
    TRANSFER_FEE_PCT: float = 1.5
    LOAN_INTEREST_PCT: float = 10.0
    MAX_LOAN_AMOUNT: float = 50000
    MIN_TRANSFER_AMOUNT: float = 100
    MIN_LOAN_AMOUNT: float = 500

    # ── MTN MoMo ─────────────────────────────────────────────
    MTN_MOMO_BASE_URL: str = "https://sandbox.momodeveloper.mtn.com"
    MTN_MOMO_SUBSCRIPTION_KEY: str = ""
    MTN_MOMO_API_USER: str = ""
    MTN_MOMO_API_KEY: str = ""
    MTN_MOMO_ENVIRONMENT: str = "sandbox"
    MTN_MOMO_CURRENCY: str = "RWF"
    MTN_MOMO_CALLBACK_URL: str = ""

    # ── Airtel ────────────────────────────────────────────────
    AIRTEL_BASE_URL: str = "https://openapi.airtel.africa"
    AIRTEL_CLIENT_ID: str = ""
    AIRTEL_CLIENT_SECRET: str = ""
    AIRTEL_ENVIRONMENT: str = "sandbox"

    # ── SMS ───────────────────────────────────────────────────
    SMS_PROVIDER: str = "africas_talking"
    AT_API_KEY: str = ""
    AT_USERNAME: str = ""
    AT_SENDER_ID: str = "FlowCash"

    # ── Admin ─────────────────────────────────────────────────
    ADMIN_SECRET_KEY: str = "changeme_admin"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Single instance used everywhere
settings = Settings()
