"""Application Configuration Module."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base Directories
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
DATABASE_DIR = ROOT_DIR / "database"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_DB_PATH = DATABASE_DIR / "vce.db"
FRONTEND_DIR = ROOT_DIR / "frontend"


class Settings(BaseSettings):
    APP_NAME: str = "VCE Pali — e-Gram Seva & Financial Ledger"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    SECRET_KEY: str = "vce_tracker_secret_key_change_in_production_2026"
    DB_PATH: str = str(DEFAULT_DB_PATH)
    CORS_ORIGINS: list[str] = ["http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:3000"]
    TIMEZONE: str = "Asia/Kolkata"
    CURRENCY_SYMBOL: str = "₹"
    DEFAULT_OPERATOR_ID: str = "akrajput2005"
    DEFAULT_OPERATOR_PASS: str = "Akshay@05"

    model_config = {
        "env_file": str(ROOT_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


settings = Settings()
