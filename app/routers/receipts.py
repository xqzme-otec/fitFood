"""Сканирование чека и подтверждение добавления продуктов в холодильник."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import require_profile
from app.database import get_db
from app.models import Receipt, User
from app.models.enums import ReceiptStatus
from app.schemas.fridge import FridgeItemOut
from app.schemas.receipt import ReceiptConfirm, ReceiptOut, ReceiptTextIn
from app.services import fridge as fridge_service
from app.services import receipt as receipt_service

router = APIRouter(prefix="/receipts", tags=["receipts"])


@router.post("/scan", response_model=ReceiptOut, status_code=201)
async def scan_receipt_image(
    file: UploadFile = File(...),
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Загрузка фото чека -> OCR (мок) -> разбор -> список позиций на подтверждение."""
    image_bytes = await file.read()
    receipt = receipt_service.process_receipt(
        db, user, image_bytes=image_bytes, filename=file.filename or ""
    )
    return receipt


@router.post("/scan-text", response_model=ReceiptOut, status_code=201)
def scan_receipt_text(
    payload: ReceiptTextIn,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Альтернатива фото: вставка текста чека вручную."""
    receipt = receipt_service.process_receipt(db, user, raw_text=payload.text)
    return receipt


@router.get("/{receipt_id}", response_model=ReceiptOut)
def get_receipt(
    receipt_id: int,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    receipt = db.get(Receipt, receipt_id)
    if not receipt or receipt.user_id != user.id:
        raise HTTPException(status_code=404, detail="Чек не найден")
    return receipt


@router.post("/{receipt_id}/confirm", response_model=list[FridgeItemOut])
def confirm_receipt(
    receipt_id: int,
    payload: ReceiptConfirm,
    user: User = Depends(require_profile),
    db: Session = Depends(get_db),
):
    """Подтверждение: принятые продукты добавляются в холодильник."""
    receipt = db.get(Receipt, receipt_id)
    if not receipt or receipt.user_id != user.id:
        raise HTTPException(status_code=404, detail="Чек не найден")
    if receipt.status == ReceiptStatus.confirmed:
        raise HTTPException(status_code=400, detail="Чек уже подтверждён")

    added = receipt_service.confirm_receipt(db, user, receipt, payload.items)
    return [fridge_service.serialize_item(i) for i in added]
