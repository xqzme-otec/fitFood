"""Каталог продуктов и блюд: поиск, просмотр, создание."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models import Dish, DishIngredient, Product, User
from app.schemas.product import (
    DishCreate,
    DishOut,
    IngredientOut,
    ProductCreate,
    ProductOut,
)
from app.services.naming import clean_display_name

router = APIRouter(tags=["catalog"])


def _product_to_out(product: Product) -> ProductOut:
    """Сериализация продукта с очисткой названия от каталожного мусора."""
    out = ProductOut.model_validate(product)
    out.name = clean_display_name(product.name) or product.name
    return out


def _dish_to_out(dish: Dish) -> DishOut:
    return DishOut(
        id=dish.id,
        name=dish.name,
        description=dish.description,
        category=dish.category,
        total_grams=dish.total_grams,
        per_100g=dish.per_100g(),
        ingredients=[
            IngredientOut(product_id=i.product_id, name=i.product.name, grams=i.grams)
            for i in dish.ingredients
        ],
    )


@router.get("/products", response_model=list[ProductOut])
def search_products(
    q: str | None = Query(default=None, description="Поиск по названию"),
    category: str | None = None,
    limit: int = Query(default=30, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if q:
        query = query.filter(Product.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(Product.category == category)
    return [_product_to_out(p) for p in query.limit(limit).all()]


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    return _product_to_out(product)


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/dishes", response_model=list[DishOut])
def search_dishes(
    q: str | None = Query(default=None),
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Dish)
    if q:
        query = query.filter(Dish.name.ilike(f"%{q}%"))
    return [_dish_to_out(d) for d in query.limit(limit).all()]


@router.get("/dishes/{dish_id}", response_model=DishOut)
def get_dish(dish_id: int, db: Session = Depends(get_db)):
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    return _dish_to_out(dish)


@router.post("/dishes", response_model=DishOut, status_code=201)
def create_dish(
    payload: DishCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    dish = Dish(name=payload.name, description=payload.description, category=payload.category)
    db.add(dish)
    db.flush()
    for ing in payload.ingredients:
        if not db.get(Product, ing.product_id):
            raise HTTPException(status_code=400, detail=f"Продукт {ing.product_id} не найден")
        db.add(DishIngredient(dish_id=dish.id, product_id=ing.product_id, grams=ing.grams))
    db.commit()
    db.refresh(dish)
    return _dish_to_out(dish)


@router.put("/dishes/{dish_id}", response_model=DishOut)
def update_dish(
    dish_id: int,
    payload: DishCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    dish.name = payload.name
    dish.description = payload.description
    db.query(DishIngredient).filter(DishIngredient.dish_id == dish_id).delete()
    for ing in payload.ingredients:
        if not db.get(Product, ing.product_id):
            raise HTTPException(status_code=400, detail=f"Продукт {ing.product_id} не найден")
        db.add(DishIngredient(dish_id=dish.id, product_id=ing.product_id, grams=ing.grams))
    db.commit()
    db.refresh(dish)
    return _dish_to_out(dish)


@router.delete("/dishes/{dish_id}", status_code=204)
def delete_dish(
    dish_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    db.query(DishIngredient).filter(DishIngredient.dish_id == dish_id).delete()
    db.delete(dish)
    db.commit()
