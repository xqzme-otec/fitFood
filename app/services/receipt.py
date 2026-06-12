"""Конвейер обработки чека: OCR -> LLM -> фильтрация -> позиции на подтверждение."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import Receipt, ReceiptItem, User
from app.models.enums import FridgeCategory, ReceiptStatus
from app.services import classifier, llm, ocr


def process_receipt(
    db: Session,
    user: User,
    *,
    raw_text: str | None = None,
    image_bytes: bytes | None = None,
    filename: str = "",
) -> Receipt:
    """Создаёт чек со списком распознанных позиций (статус pending).

    1. Если текста нет — получаем его из OCR по изображению.
    2. LLM/мок разбирает строки: что еда, количество, цена, срок хранения.
    3. ML-классификатор присваивает категорию холодильника каждой еде.
       Непродукты помечаются is_food=False (будут отброшены).
    """
    if not raw_text:
        raw_text = ocr.image_to_text(image_bytes, filename)

    parsed = llm.parse_receipt(raw_text)

    receipt = Receipt(user_id=user.id, raw_text=raw_text, status=ReceiptStatus.pending)
    db.add(receipt)
    db.flush()

    today = date.today()
    for p in parsed:
        if p.is_food:
            fridge_cat, _conf = classifier.predict_fridge_category(p.parsed_name)
            category = fridge_cat.value
            expiry = today + timedelta(days=p.expiry_days) if p.expiry_days else None
        else:
            category = "Отброшено (не еда)"
            expiry = None

        db.add(
            ReceiptItem(
                receipt_id=receipt.id,
                raw_name=p.raw_name,
                parsed_name=p.parsed_name,
                category=category,
                quantity=p.quantity,
                unit=p.unit,
                price=p.price,
                expiry_date=expiry,
                is_food=p.is_food,
                accepted=p.is_food,  # по умолчанию принимаем только еду
            )
        )

    db.commit()
    db.refresh(receipt)
    return receipt


def confirm_receipt(
    db: Session,
    user: User,
    receipt: Receipt,
    confirmations: list,
) -> list:
    """Применяет подтверждение пользователя: добавляет принятые позиции в холодильник.

    confirmations — список ReceiptItemConfirm (item_id, accepted, опц. правки).
    Возвращает созданные/обновлённые FridgeItem.
    """
    from app.services import fridge as fridge_service

    overrides = {c.item_id: c for c in confirmations}
    added = []

    for item in receipt.items:
        c = overrides.get(item.id)
        if c is not None:
            item.accepted = c.accepted
            if c.parsed_name is not None:
                item.parsed_name = c.parsed_name
            if c.category is not None:
                item.category = c.category
            if c.quantity is not None:
                item.quantity = c.quantity
            if c.expiry_date is not None:
                item.expiry_date = c.expiry_date

        if not item.accepted or not item.is_food:
            continue

        fridge_item = fridge_service.add_or_merge_item(
            db, user,
            name=item.parsed_name,
            quantity=item.quantity,
            unit=item.unit,
            category=item.category if item.category != FridgeCategory.other.value else None,
            expiry_date=item.expiry_date,
            price=item.price,
            commit=False,
        )
        added.append(fridge_item)

    receipt.status = ReceiptStatus.confirmed
    db.commit()
    return added
