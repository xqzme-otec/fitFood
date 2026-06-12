"""Подключение к БД и базовый класс моделей (SQLAlchemy 2.0)."""
from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

# Для SQLite нужен флаг check_same_thread=False (FastAPI работает в нескольких потоках).
connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(
    settings.database_url,
    echo=False,
    future=True,
    connect_args=connect_args,
)

if _is_sqlite:
    # Встроенный SQLite lower() не приводит кириллицу к нижнему регистру,
    # из-за чего ilike-поиск по русским названиям не работает. Подменяем
    # lower() на Python-реализацию с поддержкой Unicode — это чинит и ilike,
    # который компилируется в `lower(x) LIKE lower(y)`.
    @event.listens_for(engine, "connect")
    def _register_unicode_lower(dbapi_conn, _record):  # noqa: ANN001
        dbapi_conn.create_function(
            "lower", 1, lambda s: s.lower() if isinstance(s, str) else s
        )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI-зависимость: отдаёт сессию и гарантированно закрывает её."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
