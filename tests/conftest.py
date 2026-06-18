"""Общие фикстуры для тестов.

ВАЖНО: переменные окружения выставляются до импорта app, чтобы приложение
поднялось на изолированной тестовой БД (SQLite во временном файле) в мок-режиме
LLM/OCR. Так тесты не зависят от запущенного PostgreSQL/Docker.
"""
import os
import tempfile
import uuid
from pathlib import Path

# --- Изоляция окружения ДО импорта app ---
_TMP_DB = Path(tempfile.gettempdir()) / "fitfood_test.db"
if _TMP_DB.exists():
    _TMP_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB}"
os.environ["LLM_PROVIDER"] = "mock"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.data.seed import run_seed  # noqa: E402
from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _prepare_database():
    """Создаёт схему и наполняет каталог один раз на всю сессию тестов."""
    Base.metadata.create_all(bind=engine)
    run_seed()
    yield
    engine.dispose()
    if _TMP_DB.exists():
        _TMP_DB.unlink()


@pytest.fixture(scope="session")
def client():
    """TestClient без контекст-менеджера: lifespan не запускаем (БД уже готова)."""
    return TestClient(app)


# --- Хелперы для пользователей ---

DEFAULT_PROFILE = {
    "sex": "male",
    "height_cm": 180,
    "weight_kg": 85,
    "age": 30,
    "activity_level": "medium",
    "goal": "lose",
    "target_weight_kg": 78,
    "target_days": 90,
    "meals_per_day": 3,
}


def _unique_email() -> str:
    return f"user_{uuid.uuid4().hex[:12]}@example.com"


def register_and_login(client: TestClient, password: str = "secret123") -> dict:
    """Регистрирует нового пользователя и возвращает заголовки авторизации."""
    email = _unique_email()
    r = client.post("/auth/register", json={"email": email, "password": password})
    assert r.status_code in (200, 201), r.text
    r = client.post("/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers(client):
    """Заголовки авторизации свежего пользователя (без анкеты)."""
    return register_and_login(client)


@pytest.fixture
def profiled_headers(client):
    """Заголовки пользователя с заполненной анкетой (цель — похудение)."""
    headers = register_and_login(client)
    r = client.post("/profile", headers=headers, json=DEFAULT_PROFILE)
    assert r.status_code in (200, 201), r.text
    return headers


@pytest.fixture
def meal_slot_id(client, profiled_headers):
    """ID первого приёма пищи пользователя с анкетой."""
    r = client.get("/profile/meals", headers=profiled_headers)
    assert r.status_code == 200, r.text
    return r.json()[0]["id"]
