"""
tests/test_api.py
──────────────────
Basic API tests. Run with:  pytest tests/ -v

These tests use SQLite in-memory so no real DB needed.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from app.core.database import Base, get_db

# Use in-memory SQLite for tests (isolated, fast)
TEST_DB_URL = "sqlite:///./test_flowcash.db"
engine_test = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine_test)

client = TestClient(app)


# ─── Fixtures ─────────────────────────────────────────────────

@pytest.fixture
def registered_user():
    """Register a test user and return their auth token."""
    resp = client.post("/auth/register", json={
        "name": "Test User",
        "phone": "0780000099",
        "pin": "1234",
        "provider": "MTN"
    })
    assert resp.status_code == 201
    return resp.json()

@pytest.fixture
def auth_headers(registered_user):
    token = registered_user["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─── Auth tests ───────────────────────────────────────────────

def test_register_success():
    resp = client.post("/auth/register", json={
        "name": "Jane Doe",
        "phone": "0780000001",
        "pin": "5678",
        "provider": "Airtel"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["name"] == "Jane Doe"


def test_register_duplicate_phone(registered_user):
    resp = client.post("/auth/register", json={
        "name": "Another User",
        "phone": "0780000099",  # same phone
        "pin": "9999",
        "provider": "MTN"
    })
    assert resp.status_code == 409


def test_login_success(registered_user):
    resp = client.post("/auth/login", json={
        "phone": "0780000099",
        "pin": "1234"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_pin(registered_user):
    resp = client.post("/auth/login", json={
        "phone": "0780000099",
        "pin": "0000"
    })
    assert resp.status_code == 401


def test_get_profile(auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["phone"] == "0780000099"


# ─── Balance tests ────────────────────────────────────────────

def test_topup(auth_headers):
    resp = client.post("/payments/topup", json={"amount": 10000}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["type"] == "topup"

    # Check balance updated
    bal = client.get("/users/me/balance", headers=auth_headers)
    assert bal.json()["balance"] == 10000


def test_topup_below_minimum(auth_headers):
    resp = client.post("/payments/topup", json={"amount": 100}, headers=auth_headers)
    assert resp.status_code == 400


# ─── Payment tests ────────────────────────────────────────────

def test_send_money(auth_headers):
    # Top up first
    client.post("/payments/topup", json={"amount": 20000}, headers=auth_headers)

    # Register recipient
    client.post("/auth/register", json={
        "name": "Recipient",
        "phone": "0780000098",
        "pin": "0000",
        "provider": "MTN"
    })

    resp = client.post("/payments/send", json={
        "recipient_phone": "0780000098",
        "amount": 5000,
        "note": "Test payment"
    }, headers=auth_headers)

    assert resp.status_code == 201
    assert resp.json()["type"] == "send"


def test_send_insufficient_balance(auth_headers):
    resp = client.post("/payments/send", json={
        "recipient_phone": "0780000098",
        "amount": 999999
    }, headers=auth_headers)
    assert resp.status_code == 400


def test_fee_preview(auth_headers):
    resp = client.get("/payments/fee-preview?amount=10000", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["fee"] > 0
    assert data["total_deducted"] == data["amount"] + data["fee"]


# ─── Loan tests ───────────────────────────────────────────────

def test_loan_apply_and_repay(auth_headers):
    # Top up to cover repayment
    client.post("/payments/topup", json={"amount": 10000}, headers=auth_headers)

    # Apply for loan
    resp = client.post("/loans/apply", json={"amount": 2000, "term_days": 14}, headers=auth_headers)
    assert resp.status_code == 201
    loan = resp.json()
    assert loan["status"] == "active"
    assert loan["total_owed"] > loan["principal"]   # interest was added

    # Check active loan
    active = client.get("/loans/active", headers=auth_headers)
    assert active.status_code == 200

    # Repay
    repay = client.post("/loans/repay", headers=auth_headers)
    assert repay.status_code == 200
    assert "repaid" in repay.json()["message"].lower()


def test_cannot_have_two_active_loans(auth_headers):
    client.post("/payments/topup", json={"amount": 20000}, headers=auth_headers)
    client.post("/loans/apply", json={"amount": 1000, "term_days": 7}, headers=auth_headers)

    # Try to apply again
    resp = client.post("/loans/apply", json={"amount": 1000, "term_days": 7}, headers=auth_headers)
    assert resp.status_code == 400
    assert "active loan" in resp.json()["detail"].lower()
