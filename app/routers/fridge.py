"""Умный холодильник: добавление, просмотр (по категориям), изменение, удаление."""
from collections import OrderedDict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_profile
from app.database import get_db
from app.models import FridgeItem, User
from app.models.enums import FridgeCategory
from app.schemas.fridge import (
    FridgeCategoryGroup,
    FridgeItemCreate,
    FridgeItemOut,
    FridgeItemUpdate,
)
from app.services import fridge as fridge_service

router = APIRouter(prefix="/fridge", tags=["fridge"])


@router.post("/items", response_model=FridgeItemOut, status_code=201)
def add_item(
    payload: FridgeItemCreate,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Ручное добавление продукта.

    Категория определяется ML-классификатором (если не задана),
    срок годности — через LLM (если не задан). Дубликаты объединяются.
    """
    item = fridge_service.add_or_merge_item(
        db, user,
        name=payload.name,
        quantity=payload.quantity,
        unit=payload.unit,
        category=payload.category,
        expiry_date=payload.expiry_date,
        price=payload.price,
        product_id=payload.product_id,
    )
    return fridge_service.serialize_item(item)


@router.get("/items", response_model=list[FridgeItemOut])
def list_items(
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    items = db.query(FridgeItem).filter(FridgeItem.user_id == user.id).all()
    return [fridge_service.serialize_item(i) for i in items]


@router.get("/grouped", response_model=list[FridgeCategoryGroup])
def grouped_items(
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Содержимое холодильника, сгруппированное по категориям (для UI)."""
    items = db.query(FridgeItem).filter(FridgeItem.user_id == user.id).all()
    groups: "OrderedDict[str, list]" = OrderedDict(
        (c.value, []) for c in FridgeCategory
    )
    for item in items:
        groups.setdefault(item.category, []).append(fridge_service.serialize_item(item))
    return [
        FridgeCategoryGroup(category=cat, items=items)
        for cat, items in groups.items()
        if items
    ]


@router.patch("/items/{item_id}", response_model=FridgeItemOut)
def update_item(
    item_id: int,
    payload: FridgeItemUpdate,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Изменение количества/срока (например, макароны 500 г -> 100 г)."""
    item = db.get(FridgeItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    if payload.quantity is not None:
        item.quantity = payload.quantity
    if payload.expiry_date is not None:
        item.expiry_date = payload.expiry_date
    db.commit()
    db.refresh(item)
    return fridge_service.serialize_item(item)


@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    item = db.get(FridgeItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    db.delete(item)
    db.commit()
