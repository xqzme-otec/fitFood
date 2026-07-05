"""Получение состава чека по QR-коду через API ФНС (proverkacheka.com).

QR на кассовом чеке кодирует строку вида:
    t=20230101T1200&s=123.45&fn=9999078900012345&i=12345&fp=1234567890&n=1
где t — дата/время, s — сумма, fn — номер фискального накопителя,
i — номер фискального документа, fp — фискальный признак, n — тип операции.

Эту строку отправляем в proverkacheka.com и получаем реальный список купленных
позиций. Дальше их разбирает llm.parse_structured_items (фильтр непищёвки,
категория, срок хранения) — тот же конвейер, что и для текста/фото чека.

Без CHECK_TOKEN работает детерминированный мок — проект остаётся запускаемым
без внешних ключей (как и LLM/OCR).
"""
from __future__ import annotations

import time

import httpx

from app.config import settings


class CheckApiError(Exception):
    """Ошибка получения чека (токен просрочен, чек не найден, сервис недоступен)."""


# Коды ответа сервиса (см. тех. спецификацию proverkacheka, раздел «Формат ответа»).
# 1 — успех; 2/4 — данные ещё не готовы (запрос к ФНС асинхронный) → можно повторить.
_CODE_RETRYABLE = {2, 4}
_CODE_MESSAGES = {
    0: "чек некорректен или не найден в базе ФНС",
    2: "данные чека ещё не получены от ФНС — попробуйте через минуту",
    3: "превышено количество запросов к сервису проверки чеков",
    4: "сервис проверки чеков просит подождать перед повторным запросом",
    5: "данные чека не получены",
}

# Повторы для асинхронных кодов 2/4 (первый запрос к ФНС часто возвращает «ещё не готово»).
_MAX_ATTEMPTS = 3
_RETRY_DELAY_SEC = 1.5


# Демо-состав чека для мок-режима (когда CHECK_TOKEN не задан). Есть еда и
# непродукты, чтобы проверить фильтрацию и подтверждение.
_DEMO_ITEMS: list[dict] = [
    {"name": "Молоко Простоквашино 930мл", "quantity": 1.0, "price": 89.90},
    {"name": "Куриное филе охлаждённое", "quantity": 0.8, "price": 279.50},
    {"name": "Брокколи свежая 400г", "quantity": 1.0, "price": 119.00},
    {"name": "Хлеб бородинский 400г", "quantity": 1.0, "price": 45.90},
    {"name": "Мыло Dove 100г", "quantity": 1.0, "price": 79.00},
    {"name": "Творог 9% 200г", "quantity": 2.0, "price": 89.90},
]


def fetch_check_items(qrraw: str) -> list[dict]:
    """Возвращает позиции чека по сырой строке QR.

    Результат: список {"name": str, "quantity": float, "price": float} —
    цены уже в рублях (API ФНС отдаёт копейки целым числом).

    Бросает CheckApiError при просроченном токене / ненайденном чеке / сбое сети.
    """
    qrraw = (qrraw or "").strip()
    if not qrraw:
        raise CheckApiError("Пустая строка QR-кода")

    # Мок-режим: ключ не настроен — отдаём демо-чек, чтобы конвейер был тестируем.
    if not settings.check_token:
        print(
            "[check_api] CHECK_TOKEN не задан — возвращается ДЕМО-чек (mock). "
            "Задайте CHECK_TOKEN в .env и перезапустите сервер для реальных чеков."
        )
        return list(_DEMO_ITEMS)

    # Запрос к ФНС асинхронный: на коды 2/4 («ещё не готово») повторяем с паузой.
    for attempt in range(_MAX_ATTEMPTS):
        payload = _request(qrraw)
        code = payload.get("code")
        if code == 1:
            return _parse_items(payload)
        if code in _CODE_RETRYABLE and attempt < _MAX_ATTEMPTS - 1:
            time.sleep(_RETRY_DELAY_SEC)
            continue
        raise CheckApiError(_error_message(code, payload))

    # Недостижимо: цикл всегда либо возвращает, либо бросает на последней попытке.
    raise CheckApiError(_CODE_MESSAGES[2])


def _request(qrraw: str) -> dict:
    """Один POST-запрос формата 2 (qrraw + token). Возвращает распарсенный JSON."""
    try:
        resp = httpx.post(
            settings.check_url,
            data={"token": settings.check_token, "qrraw": qrraw},
            timeout=20.0,
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPError as exc:
        raise CheckApiError(f"Сервис проверки чека недоступен: {exc}") from exc
    except ValueError as exc:  # некорректный JSON
        raise CheckApiError("Некорректный ответ сервиса проверки чека") from exc


def _error_message(code, payload: dict) -> str:
    """Человекочитаемое сообщение по коду ответа (с фолбэком на data-строку)."""
    if code in _CODE_MESSAGES:
        return f"Чек не получен: {_CODE_MESSAGES[code]}"
    detail = payload.get("data")
    detail = detail if isinstance(detail, str) else "чек не найден или токен недействителен"
    return f"Чек не получен: {detail}"


def _parse_items(payload: dict) -> list[dict]:
    """Достаёт позиции из успешного ответа и переводит копейки в рубли."""
    data = payload.get("data") or {}
    doc = data.get("json") or {}
    raw_items = doc.get("items") or []
    if not raw_items:
        raise CheckApiError("В чеке не найдено ни одной позиции")

    items: list[dict] = []
    for it in raw_items:
        name = str(it.get("name") or "").strip()
        if not name:
            continue
        items.append(
            {
                "name": name,
                "quantity": float(it.get("quantity") or 1.0),
                "price": _kopecks_to_rub(it.get("price")),
            }
        )
    if not items:
        raise CheckApiError("В чеке не найдено ни одной позиции")
    return items


def _kopecks_to_rub(value) -> float | None:
    """Цена ФНС хранится в копейках целым числом (8990 → 89.90)."""
    if value is None:
        return None
    try:
        return round(float(value) / 100.0, 2)
    except (TypeError, ValueError):
        return None
