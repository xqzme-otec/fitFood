"""Каталог рецептов: меню (завтрак/обед/…), фильтры и просмотр.

Фильтры:
  • menu      — раздел меню (завтрак, обед, ужин, здоровая_еда, десерты, закуски);
  • КБЖУ      — диапазоны на 100 г (cal/protein/fat/carbs min/max);
  • time_max  — максимальное время приготовления, мин;
  • sort=match — сортировка по числу совпавших с холодильником ингредиентов.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models import FridgeItem, Recipe, User
from app.schemas.recipe import (
    MenuOut,
    RecipeCard,
    RecipeDetail,
    RecipeIngredient,
    RecipeListOut,
)
from app.services import recipes as svc

# Префикс /api/... чтобы не конфликтовать с фронтенд-страницей /recipes
# (Next.js dev-proxy матчит по пути, см. frontend/next.config.mjs).
router = APIRouter(prefix="/api/recipes", tags=["recipes"])


def _card(recipe: Recipe, fridge: set[str]) -> RecipeCard:
    keys = recipe.ingredient_keys.split() if recipe.ingredient_keys else []
    return RecipeCard(
        id=recipe.id,
        menu=recipe.menu,
        name=recipe.name,
        photo_url=recipe.photo_url,
        calories=round(recipe.calories, 1),
        protein=round(recipe.protein, 1),
        fat=round(recipe.fat, 1),
        carbs=round(recipe.carbs, 1),
        category=recipe.category,
        cuisine=recipe.cuisine,
        cook_time_min=recipe.cook_time_min,
        servings=recipe.servings,
        match_count=len(set(keys) & fridge) if fridge else 0,
        total_ingredients=len(keys),
    )


@router.get("/menus", response_model=list[MenuOut])
def list_menus(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Разделы меню с количеством рецептов — для верхних вкладок."""
    counts = dict(
        db.query(Recipe.menu, func.count(Recipe.id)).group_by(Recipe.menu).all()
    )
    return [
        MenuOut(key=key, label=label, count=counts.get(key, 0))
        for key, label in svc.MENU_LABELS.items()
        if counts.get(key, 0) > 0
    ]


@router.get("", response_model=RecipeListOut)
def list_recipes(
    menu: str | None = Query(default=None, description="Раздел меню"),
    q: str | None = Query(default=None, description="Поиск по названию"),
    cal_min: float | None = None,
    cal_max: float | None = None,
    protein_min: float | None = None,
    protein_max: float | None = None,
    fat_min: float | None = None,
    fat_max: float | None = None,
    carbs_min: float | None = None,
    carbs_max: float | None = None,
    time_max: int | None = Query(default=None, description="Макс. время готовки, мин"),
    sort: str = Query(default="relevance", description="relevance|match|calories_asc|calories_desc|time_asc"),
    limit: int = Query(default=24, ge=1, le=60),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Recipe)
    if menu:
        query = query.filter(Recipe.menu == menu)
    if q:
        query = query.filter(Recipe.name.ilike(f"%{q}%"))
    if cal_min is not None:
        query = query.filter(Recipe.calories >= cal_min)
    if cal_max is not None:
        query = query.filter(Recipe.calories <= cal_max)
    if protein_min is not None:
        query = query.filter(Recipe.protein >= protein_min)
    if protein_max is not None:
        query = query.filter(Recipe.protein <= protein_max)
    if fat_min is not None:
        query = query.filter(Recipe.fat >= fat_min)
    if fat_max is not None:
        query = query.filter(Recipe.fat <= fat_max)
    if carbs_min is not None:
        query = query.filter(Recipe.carbs >= carbs_min)
    if carbs_max is not None:
        query = query.filter(Recipe.carbs <= carbs_max)
    if time_max is not None:
        query = query.filter(
            Recipe.cook_time_min.isnot(None), Recipe.cook_time_min <= time_max
        )

    total = query.count()
    fridge = svc.fridge_tokens(
        db.query(FridgeItem).filter(FridgeItem.user_id == user.id).all()
    )

    if sort == "match" and fridge:
        # Совпадения считаются в Python — грузим отфильтрованный набор целиком.
        rows = query.all()
        cards = [_card(r, fridge) for r in rows]
        cards.sort(key=lambda c: (c.match_count, -c.calories), reverse=True)
        return RecipeListOut(total=total, items=cards[offset : offset + limit])

    if sort == "calories_asc":
        query = query.order_by(Recipe.calories.asc())
    elif sort == "calories_desc":
        query = query.order_by(Recipe.calories.desc())
    elif sort == "time_asc":
        query = query.order_by(Recipe.cook_time_min.is_(None), Recipe.cook_time_min.asc())
    else:
        query = query.order_by(Recipe.id.asc())

    rows = query.offset(offset).limit(limit).all()
    return RecipeListOut(total=total, items=[_card(r, fridge) for r in rows])


@router.get("/{recipe_id}", response_model=RecipeDetail)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")

    fridge = svc.fridge_tokens(
        db.query(FridgeItem).filter(FridgeItem.user_id == user.id).all()
    )
    card = _card(recipe, fridge)

    ingredients = [
        RecipeIngredient(
            text=line.strip(),
            available=bool(svc.tokens(line) & fridge) if fridge else False,
        )
        for line in (recipe.ingredients_text or "").splitlines()
        if line.strip()
    ]

    return RecipeDetail(
        **card.model_dump(),
        source_url=recipe.source_url,
        prep_time_min=recipe.prep_time_min,
        method_text=recipe.method_text,
        ingredients=ingredients,
    )
