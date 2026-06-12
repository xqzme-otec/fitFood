"""Конфигурация приложения.

Все настройки читаются из переменных окружения / .env.
По умолчанию проект запускается на SQLite, чтобы его можно было поднять
без PostgreSQL и без внешних ключей (LLM/OCR работают в мок-режиме).
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Приложение ---
    app_name: str = "FitFood — умный холодильник"
    debug: bool = True

    # --- База данных ---
    # Для PostgreSQL укажите:
    #   postgresql+psycopg2://user:password@localhost:5432/fitfood
    database_url: str = f"sqlite:///{BASE_DIR / 'fitfood.db'}"

    # --- Безопасность / JWT ---
    secret_key: str = "CHANGE_ME_super_secret_dev_key_0123456789"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 дней

    # --- LLM / OCR ---
    # Если ключ не задан — используется детерминированная мок-реализация.
    llm_provider: str = "mock"  # mock | openai | ollama
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    # --- ML-классификатор категорий продуктов ---
    ml_models_dir: Path = BASE_DIR / "notebooks" / "models"

    # --- Данные для сидинга ---
    products_csv: Path = BASE_DIR / "data" / "fitfood_products_full_augmented.csv"
    seed_products_limit: int = 400  # сколько строк из CSV импортировать в каталог


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
