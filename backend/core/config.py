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


from typing import Union, List
from pydantic import field_validator

class Settings(BaseSettings):
    APP_NAME: str = "VCE Pali — e-Gram Seva & Financial Ledger"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    SECRET_KEY: str = "y8t79YBtdO3lnInztvHnSqGPBBG8PGuSBStYReZ14GPsAASEJeyT6a7zseaqQOQK"
    DB_PATH: str = str(DEFAULT_DB_PATH)
    CORS_ORIGINS: Union[str, List[str]] = ["*"]
    TIMEZONE: str = "Asia/Kolkata"
    CURRENCY_SYMBOL: str = "₹"
    DEFAULT_OPERATOR_ID: str = "akrajput2005"
    DEFAULT_OPERATOR_PASS: str = "Akshay@05"
    BACKEND_URL: str = "https://vce-pali-backend.onrender.com"
    FRONTEND_URL: str = "https://vce-xi.vercel.app"
    SERVE_FRONTEND: bool = False



    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if not v or v.strip() == "*":
                return ["*"]
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return ["*"]

    model_config = {
        "env_file": str(ROOT_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


settings = Settings()

