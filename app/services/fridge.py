"""Логика умного холодильника: статусы срока годности, добавление без дублей."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import FridgeItem, Product, User
from app.services import classifier, llm

SOON_THRESHOLD_DAYS = 3  # «скоро истекает», если осталось <= стольких дней


def expiry_status(expiry: date | None, today: date | None = None) -> tuple[str, int | None]:
    """Возвращает (статус, дней_осталось). Статус: ok|soon|expired|unknown."""
    if expiry is None:
        return "unknown", None
    today = today or date.today()
    days_left = (expiry - today).days
    if days_left < 0:
        return "expired", days_left
    if days_left <= SOON_THRESHOLD_DAYS:
        return "soon", days_left
    return "ok", days_left


def resolve_category(name: str, explicit: str | None) -> str:
    """Категория холодильника: явная от пользователя или предсказанная моделью."""
    if explicit:
        return explicit
    cat, _conf = classifier.predict_fridge_category(name)
    return cat.value


def resolve_product(db: Session, name: str) -> Product | None:
    """Ищет в каталоге продукт, соответствующий названию из холодильника.

    Сначала пытается точное совпадение (без учёта регистра), затем —
    лучшее пересечение значимых токенов. Нужен, чтобы показывать КБЖУ
    продукта в холодильнике и записывать его в дневник питания.
    """
    norm = name.strip().casefold()
    products = db.query(Product).all()
    for p in products:
        if p.name.casefold() == norm:
            return p

    target = {t for t in classifier.clean_title(name).split() if len(t) > 2}
    if not target:
        return None
    best, best_score = None, 0
    for p in products:
        toks = {t for t in classifier.clean_title(p.name).split() if len(t) > 2}
        score = len(target & toks)
        if score > best_score:
            best, best_score = p, score
    return best if best_score > 0 else None


def resolve_expiry(name: str, explicit: date | None) -> date:
    """Срок годности: явный или сгенерированный LLM (по типу продукта)."""
    if explicit is not None:
        return explicit
    days = llm.estimate_shelf_life_days(name)
    return date.today() + timedelta(days=days)


def add_or_merge_item(
    db: Session,
    user: User,
    *,
    name: str,
    quantity: float,
    unit: str = "g",
    category: str | None = None,
    expiry_date: date | None = None,
    price: float | None = None,
    product_id: int | None = None,
    commit: bool = True,
) -> FridgeItem:
    """Добавляет продукт в холодильник, объединяя дубликаты.

    Дубликатом считается позиция того же пользователя с тем же
    (нормализованным) именем и единицей измерения. У дубликата
    суммируется количество и берётся ближайший срок годности.
    """
    norm_name = name.strip()
    category = resolve_category(norm_name, category)
    expiry_date = resolve_expiry(norm_name, expiry_date)

    # Привязываем к продукту каталога, чтобы знать КБЖУ и уметь записывать в дневник.
    if product_id is None:
        matched = resolve_product(db, norm_name)
        if matched is not None:
            product_id = matched.id

    # Сравнение без учёта регистра делаем в Python: SQLite-функция lower()
    # не приводит к нижнему регистру кириллицу, поэтому БД-фильтру не доверяем.
    candidates = (
        db.query(FridgeItem)
        .filter(FridgeItem.user_id == user.id, FridgeItem.unit == unit)
        .all()
    )
    target_key = norm_name.casefold()
    existing = next((i for i in candidates if i.name.casefold() == target_key), None)

    if existing:
        existing.quantity += quantity
        # Берём более ранний (консервативный) срок годности.
        if existing.expiry_date is None or (
            expiry_date and expiry_date < existing.expiry_date
        ):
            existing.expiry_date = expiry_date
        item = existing
    else:
        item = FridgeItem(
            user_id=user.id,
            product_id=product_id,
            name=norm_name,
            category=category,
            quantity=quantity,
            unit=unit,
            expiry_date=expiry_date,
            price=price,
        )
        db.add(item)

    if commit:
        db.commit()
        db.refresh(item)
    return item


def serialize_item(item: FridgeItem) -> dict:
    status, days_left = expiry_status(item.expiry_date)

    # КБЖУ на 100 г (из привязанного продукта) и пересчёт на текущее количество.
    kbju_100g = None
    kbju_total = None
    product = item.product
    if product is not None:
        kbju_100g = {
            "calories": product.calories, "protein": product.protein,
            "fat": product.fat, "carbs": product.carbs,
        }
        if item.unit in ("g", "ml"):
            f = item.quantity / 100.0
            kbju_total = {
                "calories": round(product.calories * f, 1),
                "protein": round(product.protein * f, 1),
                "fat": round(product.fat * f, 1),
                "carbs": round(product.carbs * f, 1),
            }

    return {
        "id": item.id,
        "product_id": item.product_id,
        "name": item.name,
        "category": item.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "expiry_date": item.expiry_date,
        "price": item.price,
        "expiry_status": status,
        "days_left": days_left,
        "kbju_100g": kbju_100g,
        "kbju_total": kbju_total,
    }
