"""Наполнение БД: предустановленные продукты, блюда и импорт каталога из CSV.

Запускается при старте приложения (idempotent — повторно не дублирует).
Можно вызвать вручную:  python -m app.data.seed
"""
from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, engine
from app.database import Base
from app.models import Dish, DishIngredient, Product

# --- Базовые продукты: (ключ, имя, категория, ккал, белки, жиры, углеводы на 100 г) ---
BASE_PRODUCTS: list[tuple[str, str, str, float, float, float, float]] = [
    ("milk", "Молоко 2.5%", "Молочный прилавок", 52, 2.9, 2.5, 4.7),
    ("kefir", "Кефир 2.5%", "Молочный прилавок", 53, 3.4, 2.5, 4.1),
    ("tvorog", "Творог 9%", "Молочный прилавок", 159, 16.7, 9, 2.0),
    ("cheese", "Сыр российский", "Молочный прилавок", 363, 23, 30, 0),
    ("yogurt", "Йогурт натуральный", "Молочный прилавок", 60, 5, 3.2, 3.5),
    ("smetana", "Сметана 20%", "Молочный прилавок", 206, 2.8, 20, 3.2),
    ("chicken", "Куриное филе", "Мясо, птица, рыба", 113, 23.6, 1.9, 0.4),
    ("beef_mince", "Говяжий фарш", "Мясо, птица, рыба", 254, 17, 20, 0),
    ("salmon", "Лосось", "Рыба, морепродукты", 208, 20, 13, 0),
    ("egg", "Яйцо куриное", "Молочный прилавок", 157, 12.7, 11.5, 0.7),
    ("tomato", "Помидоры", "Овощи и фрукты", 20, 1.1, 0.2, 3.7),
    ("cucumber", "Огурцы", "Овощи и фрукты", 15, 0.8, 0.1, 2.8),
    ("onion", "Лук репчатый", "Овощи и фрукты", 47, 1.4, 0, 10.4),
    ("carrot", "Морковь", "Овощи и фрукты", 35, 1.3, 0.1, 6.9),
    ("potato", "Картофель", "Овощи и фрукты", 77, 2, 0.4, 16.3),
    ("cabbage", "Капуста белокочанная", "Овощи и фрукты", 28, 1.8, 0.1, 4.7),
    ("beet", "Свёкла", "Овощи и фрукты", 43, 1.5, 0.1, 8.8),
    ("broccoli", "Брокколи", "Овощи и фрукты", 34, 2.8, 0.4, 6.6),
    ("banana", "Банан", "Овощи и фрукты", 96, 1.5, 0.2, 21),
    ("apple", "Яблоко", "Овощи и фрукты", 47, 0.4, 0.4, 9.8),
    ("berries", "Ягоды (черника)", "Овощи и фрукты", 44, 1.1, 0.4, 7.6),
    ("pasta", "Макароны (сухие)", "Бакалея", 344, 10.4, 1.1, 69.7),
    ("buckwheat", "Гречка (сухая)", "Бакалея", 343, 12.6, 3.3, 62),
    ("rice", "Рис (сухой)", "Бакалея", 344, 6.7, 0.7, 78),
    ("oats", "Овсяные хлопья", "Бакалея", 366, 11.9, 7.2, 69.3),
    ("flour", "Мука пшеничная", "Бакалея", 342, 9.2, 1.2, 74.9),
    ("bread", "Хлеб пшеничный", "Хлеб и выпечка", 242, 8.1, 1, 48.8),
    ("tortilla", "Тортилья (лепёшка)", "Хлеб и выпечка", 295, 8, 7, 49),
    ("butter", "Масло сливочное", "Молочный прилавок", 748, 0.5, 82.5, 0.8),
    ("oil", "Масло растительное", "Бакалея", 899, 0, 99.9, 0),
    ("sugar", "Сахар", "Бакалея", 399, 0, 0, 99.7),
]

# --- Блюда: имя, описание, категория, [(ключ_продукта, граммы)] ---
BASE_DISHES: list[tuple[str, str, str, list[tuple[str, float]]]] = [
    ("Борщ", "Классический борщ на говядине", "Готовая еда",
     [("cabbage", 150), ("beet", 100), ("potato", 100), ("carrot", 50),
      ("onion", 50), ("beef_mince", 100), ("oil", 10)]),
    ("Кесадилья с курицей", "Лепёшка с курицей и сыром", "Готовая еда",
     [("tortilla", 120), ("chicken", 120), ("cheese", 60), ("tomato", 40)]),
    ("Паста с сыром", "Макароны с сыром и маслом", "Готовая еда",
     [("pasta", 100), ("cheese", 30), ("butter", 10)]),
    ("Овсянка с бананом", "Овсяная каша на молоке с бананом", "Готовая еда",
     [("oats", 60), ("milk", 200), ("banana", 100)]),
    ("Омлет", "Омлет на молоке", "Готовая еда",
     [("egg", 120), ("milk", 60), ("butter", 5)]),
    ("Творог с ягодами", "Творог с черникой", "Готовая еда",
     [("tvorog", 200), ("berries", 80)]),
    ("Гречка с курицей", "Гречка с куриным филе", "Готовая еда",
     [("buckwheat", 80), ("chicken", 150), ("onion", 30)]),
    ("Овощной салат", "Помидоры и огурцы с маслом", "Готовая еда",
     [("tomato", 100), ("cucumber", 100), ("oil", 10)]),
]


def _clean_catalog_name(name: str) -> str:
    text = re.sub(r"^\d+\.", "", str(name)).strip()
    return re.sub(r"\s+", " ", text)


def _to_float(value, default: float = 0.0) -> float:
    try:
        f = float(value)
        return f if f == f else default  # отсеиваем NaN
    except (TypeError, ValueError):
        return default


def seed_base(db: Session) -> dict[str, Product]:
    """Создаёт базовые продукты и блюда. Возвращает карту ключ->Product."""
    key_to_product: dict[str, Product] = {}
    for key, name, cat, cal, p, f, c in BASE_PRODUCTS:
        product = db.query(Product).filter(Product.name == name).first()
        if product is None:
            product = Product(
                name=name, category=cat, unit="g",
                calories=cal, protein=p, fat=f, carbs=c,
            )
            db.add(product)
            db.flush()
        key_to_product[key] = product

    for name, desc, cat, ingredients in BASE_DISHES:
        if db.query(Dish).filter(Dish.name == name).first():
            continue
        dish = Dish(name=name, description=desc, category=cat)
        db.add(dish)
        db.flush()
        for prod_key, grams in ingredients:
            db.add(
                DishIngredient(
                    dish_id=dish.id,
                    product_id=key_to_product[prod_key].id,
                    grams=grams,
                )
            )
    db.commit()
    return key_to_product


def seed_catalog_from_csv(db: Session, limit: int | None = None) -> int:
    """Импортирует подмножество каталога из CSV (Магнит) для богатого поиска."""
    try:
        import pandas as pd
    except ImportError:
        print("[seed] pandas не установлен — пропускаю импорт CSV")
        return 0

    path = settings.products_csv
    if not path.exists():
        print(f"[seed] CSV не найден: {path}")
        return 0

    df = pd.read_csv(path, encoding="utf-8-sig")
    limit = limit or settings.seed_products_limit
    # Берём сбалансированно по категориям, чтобы каталог был разнообразным.
    per_cat = max(1, limit // max(1, df["категория"].nunique()))
    df = df.groupby("категория", group_keys=False).head(per_cat)

    existing = {n for (n,) in db.query(Product.name).all()}
    added = 0
    for _, row in df.iterrows():
        name = _clean_catalog_name(row["название"])
        cal = _to_float(row.get("калории"))
        if not name or name in existing or cal <= 0:
            continue
        existing.add(name)
        db.add(
            Product(
                name=name,
                category=str(row["категория"]),
                unit="g",
                calories=cal,
                protein=_to_float(row.get("белки")),
                fat=_to_float(row.get("жиры")),
                carbs=_to_float(row.get("углеводы")),
            )
        )
        added += 1
    db.commit()
    return added


def run_seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Сидим только если каталог почти пуст.
        if db.query(Product).count() < len(BASE_PRODUCTS):
            seed_base(db)
            n = seed_catalog_from_csv(db)
            print(f"[seed] Базовые продукты/блюда созданы, импортировано из CSV: {n}")
        else:
            print("[seed] Каталог уже наполнен — пропускаю.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
