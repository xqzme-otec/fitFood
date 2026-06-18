"""Юнит-тесты статуса срока годности (app/services/fridge.py)."""
from datetime import date, timedelta

from app.services import fridge as fridge_service


def test_expiry_unknown_when_none():
    status, days = fridge_service.expiry_status(None)
    assert status == "unknown"
    assert days is None


def test_expiry_expired_in_past():
    today = date(2026, 6, 16)
    status, days = fridge_service.expiry_status(today - timedelta(days=2), today=today)
    assert status == "expired"
    assert days == -2


def test_expiry_soon_within_threshold():
    today = date(2026, 6, 16)
    status, days = fridge_service.expiry_status(today + timedelta(days=2), today=today)
    assert status == "soon"
    assert days == 2


def test_expiry_ok_far_future():
    today = date(2026, 6, 16)
    status, days = fridge_service.expiry_status(today + timedelta(days=30), today=today)
    assert status == "ok"
    assert days == 30


def test_expiry_today_is_soon():
    today = date(2026, 6, 16)
    status, days = fridge_service.expiry_status(today, today=today)
    assert status == "soon"
    assert days == 0
