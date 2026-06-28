"""FitFood — умный холодильник. Точка входа FastAPI."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.data.seed import run_seed
from app.database import Base, engine
from app.routers import (
    auth,
    fridge,
    meals,
    products,
    profile,
    rations,
    receipts,
    recipes,
    recommendations,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём таблицы и наполняем стартовыми данными.
    Base.metadata.create_all(bind=engine)
    run_seed()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Бэкенд умного холодильника: КБЖУ, дневник питания, чеки, рекомендации.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(products.router)
app.include_router(meals.router)
app.include_router(fridge.router)
app.include_router(receipts.router)
app.include_router(recipes.router)
app.include_router(recommendations.router)
app.include_router(rations.router)


@app.get("/health", tags=["health"])
def health():
    return {"app": settings.app_name, "status": "ok", "docs": "/docs"}


# --- Фронтенд (Next.js, статический экспорт) ---
# Next.js собирается в frontend/out (output: 'export'); раздаётся как статика
# с html=True, поэтому /today/ -> today/index.html. Монтируется ПОСЛЕ
# API-роутеров, чтобы /auth, /fridge и т.д. имели приоритет.
_frontend_out = Path(__file__).resolve().parent.parent / "frontend" / "out"
if _frontend_out.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_out), html=True), name="frontend")
