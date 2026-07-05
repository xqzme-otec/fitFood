"""Юнит-тесты сервиса проверки чека по QR (proverkacheka), без реальной сети."""
import httpx
import pytest

from app.services import check_api
from app.services.check_api import CheckApiError


def _payload(items):
    return {"code": 1, "data": {"json": {"items": items}}}


class _FakeResponse:
    """Мини-заглушка httpx.Response: задаём JSON и (опц.) ошибку декодирования."""

    def __init__(self, payload, *, bad_json=False):
        self._payload = payload
        self._bad_json = bad_json

    def raise_for_status(self):
        return None

    def json(self):
        if self._bad_json:
            raise ValueError("invalid json")
        return self._payload


def _patch_post(monkeypatch, responses):
    """Подменяет httpx.post последовательностью ответов. Возвращает список вызовов.

    Элемент responses — _FakeResponse или Exception (тогда post его бросит).
    """
    calls = []
    seq = list(responses)

    def fake_post(url, **kwargs):
        calls.append({"url": url, **kwargs})
        item = seq.pop(0)
        if isinstance(item, Exception):
            raise item
        return item

    monkeypatch.setattr(check_api.httpx, "post", fake_post)
    # Ретраи не должны реально спать в тестах.
    monkeypatch.setattr(check_api.time, "sleep", lambda *_: None)
    return calls


@pytest.fixture
def with_token(monkeypatch):
    """Включает «боевой» режим (непустой токен), чтобы шёл сетевой путь."""
    monkeypatch.setattr(check_api.settings, "check_token", "test-token")


def test_parse_items_converts_kopecks_to_rubles():
    items = check_api._parse_items(
        _payload([{"name": "Молоко", "quantity": 1, "price": 8990, "sum": 8990}])
    )
    assert items == [{"name": "Молоко", "quantity": 1.0, "price": 89.90}]


def test_parse_items_skips_nameless_and_requires_at_least_one():
    items = check_api._parse_items(
        _payload([{"name": "", "price": 100}, {"name": "Хлеб", "quantity": 2, "price": 4590}])
    )
    assert [i["name"] for i in items] == ["Хлеб"]

    with pytest.raises(CheckApiError):
        check_api._parse_items(_payload([]))


@pytest.mark.parametrize("code", [0, 2, 3, 4, 5])
def test_error_message_per_code(code):
    msg = check_api._error_message(code, {})
    assert check_api._CODE_MESSAGES[code] in msg


def test_error_message_falls_back_to_data_string():
    msg = check_api._error_message(99, {"data": "токен недействителен"})
    assert "токен недействителен" in msg


def test_kopecks_to_rub_handles_invalid():
    assert check_api._kopecks_to_rub(8990) == 89.90
    assert check_api._kopecks_to_rub(None) is None
    assert check_api._kopecks_to_rub("abc") is None


# --- Поведение fetch_check_items (мок httpx) ---

def test_empty_qrraw_raises():
    with pytest.raises(CheckApiError):
        check_api.fetch_check_items("   ")


def test_mock_mode_returns_demo_without_network(monkeypatch):
    """Без токена возвращается демо-чек и сеть не дёргается."""
    monkeypatch.setattr(check_api.settings, "check_token", "")

    def boom(*a, **k):
        raise AssertionError("httpx.post не должен вызываться в мок-режиме")

    monkeypatch.setattr(check_api.httpx, "post", boom)
    items = check_api.fetch_check_items("t=...&fn=...")
    assert items == check_api._DEMO_ITEMS
    assert items is not check_api._DEMO_ITEMS  # отдаётся копия, а не сам список


def test_success_sends_token_and_qrraw(monkeypatch, with_token):
    calls = _patch_post(
        monkeypatch,
        [_FakeResponse(_payload([{"name": "Сыр", "quantity": 1, "price": 25000}]))],
    )
    items = check_api.fetch_check_items("t=2023&s=1&fn=1&i=1&fp=1&n=1")
    assert items == [{"name": "Сыр", "quantity": 1.0, "price": 250.0}]
    assert len(calls) == 1
    assert calls[0]["data"] == {"token": "test-token", "qrraw": "t=2023&s=1&fn=1&i=1&fp=1&n=1"}


@pytest.mark.parametrize("retry_code", [2, 4])
def test_retries_on_async_codes_then_succeeds(monkeypatch, with_token, retry_code):
    calls = _patch_post(
        monkeypatch,
        [
            _FakeResponse({"code": retry_code, "data": "not ready"}),
            _FakeResponse(_payload([{"name": "Хлеб", "quantity": 1, "price": 4590}])),
        ],
    )
    items = check_api.fetch_check_items("qr")
    assert [i["name"] for i in items] == ["Хлеб"]
    assert len(calls) == 2  # был один повтор


def test_no_retry_on_rate_limit_code_3(monkeypatch, with_token):
    calls = _patch_post(monkeypatch, [_FakeResponse({"code": 3, "data": "limit"})])
    with pytest.raises(CheckApiError) as exc:
        check_api.fetch_check_items("qr")
    assert check_api._CODE_MESSAGES[3] in str(exc.value)
    assert len(calls) == 1  # код 3 не ретраится


def test_retries_exhausted_raises(monkeypatch, with_token):
    calls = _patch_post(
        monkeypatch,
        [_FakeResponse({"code": 2, "data": "not ready"})] * check_api._MAX_ATTEMPTS,
    )
    with pytest.raises(CheckApiError):
        check_api.fetch_check_items("qr")
    assert len(calls) == check_api._MAX_ATTEMPTS


def test_http_error_becomes_checkapierror(monkeypatch, with_token):
    _patch_post(monkeypatch, [httpx.ConnectError("network down")])
    with pytest.raises(CheckApiError, match="недоступен"):
        check_api.fetch_check_items("qr")


def test_bad_json_becomes_checkapierror(monkeypatch, with_token):
    _patch_post(monkeypatch, [_FakeResponse(None, bad_json=True)])
    with pytest.raises(CheckApiError, match="Некорректный ответ"):
        check_api.fetch_check_items("qr")
