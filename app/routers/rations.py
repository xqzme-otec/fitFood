"""Свайп-генератор рациона.

`GET /rations/next` отдаёт следующего кандидата блюда для конкретного приёма.
Подбор учитывает ДНЕВНОЙ остаток КБЖУ (а не только лимит приёма), поэтому после
съеденного ранее блюда следующий приём адаптируется (углеводный завтрак →
бельково-жировой обед). LLM (OpenRouter, гибридно) пишет объяснение и придумывает
блюдо, когда каталог исчерпан. Лайк = обычная запись в дневник (`/diary/entries`).
"""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import require_profile
from app.database import get_db
from app.models import FoodEntry, FridgeItem, MealSlot, Product, User
from app.schemas.meal import FoodEntryOut
from app.schemas.recommendation import (
    DayRemaining,
    IngredientAvailability,
    RationEatIn,
    RationNextOut,
)
from app.services import llm
from app.services import recipes as recipes_svc
from app.services import recommendation as rec_service

router = APIRouter(prefix="/rations", tags=["rations"])


def _best_fridge_match(name: str, fridge_items: list[FridgeItem]) -> FridgeItem | None:
    """Продукт холодильника, чьё название лучше всего пересекается с `name`."""
    target = recipes_svc.tokens(name)
    if not target:
        return None
    best, best_overlap = None, 0
    for it in fridge_items:
        overlap = len(target & recipes_svc.tokens(it.name))
        if overlap > best_overlap:
            best, best_overlap = it, overlap
    return best


def _consume_from_fridge(
    db: Session,
    fridge_items: list[FridgeItem],
    product_id: int | None,
    name: str,
    grams: float,
) -> None:
    """Списывает использованные граммы из подходящей позиции холодильника.

    Позицию ищем по product_id (приоритетно), иначе по совпадению токенов имени.
    Списываем только для весовых/объёмных единиц (g/ml); при обнулении удаляем
    позицию. Штучные (pcs) не трогаем — граммы к штукам не сводятся однозначно.
    """
    match: FridgeItem | None = None
    if product_id is not None:
        match = next((i for i in fridge_items if i.product_id == product_id), None)
    if match is None:
        target = recipes_svc.tokens(name)
        if target:
            best_overlap = 0
            for it in fridge_items:
                overlap = len(target & recipes_svc.tokens(it.name))
                if overlap > best_overlap:
                    match, best_overlap = it, overlap

    if match is None or match.unit not in ("g", "ml"):
        return
    remaining_qty = round(match.quantity - grams, 1)
    if remaining_qty <= 0:
        fridge_items.remove(match)
        db.delete(match)
    else:
        match.quantity = remaining_qty


def _resolve_ingredients(
    fridge_items: list[FridgeItem], raw_ings: list[dict]
) -> list[IngredientAvailability]:
    """Сопоставляет ингредиенты RAG-блюда с продуктами (для честного КБЖУ).

    Каждый ингредиент матчится к продукту холодильника → каталогу (надёжное КБЖУ);
    ненайденный оценивается через llm.estimate_macros и помечается available=False.
    """
    resolved: list[IngredientAvailability] = []
    for ing in raw_ings:
        name = str(ing.get("name", "")).strip()
        grams = float(ing.get("grams") or 0) or 100.0
        item = _best_fridge_match(name, fridge_items)
        product = item.product if item else None
        factor = grams / 100.0

        if product is not None:
            per100 = (product.calories, product.protein, product.fat, product.carbs)
            pid, disp_name, available = product.id, product.name, True
        elif item is not None:
            # Продукт холодильника без привязки к каталогу — берём его оценку КБЖУ.
            m = llm.estimate_macros(item.name, item.category)
            per100 = (
                item.calories or m["calories"], item.protein or m["protein"],
                item.fat or m["fat"], item.carbs or m["carbs"],
            )
            pid, disp_name, available = None, item.name, True
        else:
            m = llm.estimate_macros(name)
            per100 = (m["calories"], m["protein"], m["fat"], m["carbs"])
            pid, disp_name, available = None, name, False

        resolved.append(
            IngredientAvailability(
                product_id=pid,
                name=disp_name,
                grams_needed=round(grams, 1),
                available=available,
                note="" if available else "нет в холодильнике",
                calories=round(per100[0] * factor, 1),
                protein=round(per100[1] * factor, 1),
                fat=round(per100[2] * factor, 1),
                carbs=round(per100[3] * factor, 1),
            )
        )
    return resolved


@router.get("/next", response_model=RationNextOut | None)
def next_ration_card(
    meal_slot_id: int = Query(..., description="Для какого приёма подбираем блюдо"),
    day: date_type = Query(default_factory=date_type.today),
    exclude_names: str | None = Query(
        default=None, description="Названия уже отвергнутых блюд через '~~'"
    ),
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Следующая карточка свайпа для приёма `meal_slot_id`.

    Всегда RAG-блюдо (source=llm): холодильник + похожие рецепты каталога как
    контекст → LLM собирает блюдо из реально доступных продуктов. `exclude_names`
    — названия уже отвергнутых блюд (свайп ✗), чтобы предложить другой вариант.
    Возвращает `null`, если холодильник пуст.
    """
    slot = db.get(MealSlot, meal_slot_id)
    if not slot or slot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Приём пищи не найден")

    excluded = {n for n in (exclude_names or "").split("~~") if n.strip()}
    day_rem = rec_service.remaining_for_day(db, user, day)
    day_remaining = DayRemaining(
        calories=day_rem.calories, protein=day_rem.protein,
        fat=day_rem.fat, carbs=day_rem.carbs,
    )

    # RAG-блюдо: холодильник + похожие рецепты каталога → LLM.
    fridge_items = db.query(FridgeItem).filter(FridgeItem.user_id == user.id).all()
    retrieved = [
        {
            "name": r.name, "ingredients_text": r.ingredients_text,
            "method_text": r.method_text, "calories": r.calories,
            "protein": r.protein, "fat": r.fat, "carbs": r.carbs,
        }
        for r in recipes_svc.retrieve_matching(db, fridge_items, limit=6)
    ]
    idea = llm.generate_ration(day_rem, fridge_items, retrieved, exclude_names=excluded)
    if idea is None:
        return None  # холодильник пуст — предложить нечего

    ingredients = _resolve_ingredients(fridge_items, idea["ingredients"])
    totals = {
        "calories": round(sum(i.calories for i in ingredients), 1),
        "protein": round(sum(i.protein for i in ingredients), 1),
        "fat": round(sum(i.fat for i in ingredients), 1),
        "carbs": round(sum(i.carbs for i in ingredients), 1),
    }
    return RationNextOut(
        dish_id=None,
        name=idea["name"],
        kind="llm",
        score=0.0,
        reason=idea["reason"],
        method=idea.get("method", ""),
        **totals,
        suggested_grams=round(sum(i.grams_needed for i in ingredients), 1),
        missing_ingredients=[i.name for i in ingredients if not i.available],
        ingredients=ingredients,
        source="llm",
        meal_slot_id=slot.id,
        day_remaining=day_remaining,
    )


@router.post("/eat", response_model=list[FoodEntryOut], status_code=201)
def eat_ration(
    payload: RationEatIn,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """«Съел это» для RAG-блюда: пишет каждый ингредиент в приём пищи отдельной записью.

    Ингредиенты с product_id пересчитываются по каталогу (надёжное КБЖУ);
    остальные сохраняются снимком из тела запроса.
    """
    slot = db.get(MealSlot, payload.meal_slot_id)
    if not slot or slot.user_id != user.id:
        raise HTTPException(status_code=404, detail="Приём пищи не найден")
    if not payload.ingredients:
        raise HTTPException(status_code=400, detail="Список ингредиентов пуст")

    day = payload.day or date_type.today()
    fridge_items = db.query(FridgeItem).filter(FridgeItem.user_id == user.id).all()
    created: list[FoodEntry] = []
    for ing in payload.ingredients:
        # Списываем использованное количество из холодильника.
        _consume_from_fridge(db, fridge_items, ing.product_id, ing.name, ing.grams)

        product = db.get(Product, ing.product_id) if ing.product_id else None
        if product is not None:
            factor = ing.grams / 100.0
            cal, pro, fat, carb = (
                round(product.calories * factor, 1), round(product.protein * factor, 1),
                round(product.fat * factor, 1), round(product.carbs * factor, 1),
            )
            name = product.name
        else:
            cal, pro, fat, carb = ing.calories, ing.protein, ing.fat, ing.carbs
            name = ing.name

        entry = FoodEntry(
            user_id=user.id,
            meal_slot_id=slot.id,
            entry_date=day,
            product_id=product.id if product else None,
            dish_id=None,
            name=name,
            amount=ing.grams,
            calories=cal,
            protein=pro,
            fat=fat,
            carbs=carb,
        )
        db.add(entry)
        created.append(entry)

    db.commit()
    for e in created:
        db.refresh(e)
    return created
