"""Тесты аутентификации: регистрация, логин, /auth/me."""
import uuid


def _email():
    return f"auth_{uuid.uuid4().hex[:10]}@example.com"


def test_register_success(client):
    r = client.post("/auth/register", json={"email": _email(), "password": "secret123"})
    assert r.status_code in (200, 201), r.text


def test_register_duplicate_rejected(client):
    email = _email()
    assert client.post("/auth/register", json={"email": email, "password": "secret123"}).status_code in (200, 201)
    r = client.post("/auth/register", json={"email": email, "password": "secret123"})
    assert r.status_code == 400


def test_login_returns_token(client):
    email = _email()
    client.post("/auth/register", json={"email": email, "password": "secret123"})
    r = client.post("/auth/login", data={"username": email, "password": "secret123"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["access_token"]
    assert body["token_type"].lower() == "bearer"


def test_login_wrong_password(client):
    email = _email()
    client.post("/auth/register", json={"email": email, "password": "secret123"})
    r = client.post("/auth/login", data={"username": email, "password": "WRONG"})
    assert r.status_code == 401


def test_me_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_me_with_token(client, auth_headers):
    r = client.get("/auth/me", headers=auth_headers)
    assert r.status_code == 200, r.text
    assert "@example.com" in r.json()["email"]
