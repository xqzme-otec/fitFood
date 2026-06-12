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
    receipts,
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
app.include_router(recommendations.router)


@app.get("/health", tags=["health"])
def health():
    return {"app": settings.app_name, "status": "ok", "docs": "/docs"}


# --- Фронтенд (SPA) ---
# Раздаётся как статика; index.html отдаётся на "/" (html=True).
# Монтируется ПОСЛЕ API-роутеров, поэтому /auth, /fridge и т.д. имеют приоритет.
_frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if _frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dir), html=True), name="frontend")
