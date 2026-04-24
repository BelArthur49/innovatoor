"""
app/models/schemas.py
──────────────────────
Pydantic schemas = the shape of data coming IN (requests)
and going OUT (responses) of the API.

FastAPI uses these to:
  - Validate request bodies automatically
  - Generate the interactive API docs at /docs
  - Serialize responses
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import re


# ─── Auth ──────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, example="Jane Doe")
    phone: str = Field(..., example="0780000001")
    pin: str = Field(..., min_length=4, max_length=6, example="1234")
    provider: str = Field(..., example="MTN")

    @validator("phone")
    def clean_phone(cls, v):
        # Strip spaces and normalize
        cleaned = re.sub(r"\s+", "", v)
        if not re.match(r"^\+?[0-9]{9,15}$", cleaned):
            raise ValueError("Invalid phone number format")
        return cleaned

    @validator("pin")
    def pin_must_be_digits(cls, v):
        if not v.isdigit():
            raise ValueError("PIN must contain only digits")
        return v

    @validator("provider")
    def valid_provider(cls, v):
        allowed = ["MTN", "Airtel", "Orange", "M-Pesa"]
        if v not in allowed:
            raise ValueError(f"Provider must be one of: {allowed}")
        return v


class LoginRequest(BaseModel):
    phone: str = Field(..., example="0780000001")
    pin: str = Field(..., example="1234")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str


class OTPVerifyRequest(BaseModel):
    phone: str
    code: str = Field(..., min_length=6, max_length=6)


# ─── User ──────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    name: str
    phone: str
    provider: str
    balance: float
    credit_score: int
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True   # allows reading from SQLAlchemy models


class UserBalanceResponse(BaseModel):
    balance: float
    credit_score: int
    max_loan_eligible: float   # calculated based on credit score


# ─── Payments ──────────────────────────────────────────────────

class SendMoneyRequest(BaseModel):
    recipient_phone: str = Field(..., example="0780000002")
    amount: float = Field(..., gt=0, example=5000)
    note: Optional[str] = Field(None, max_length=200, example="School fees")

    @validator("recipient_phone")
    def clean_phone(cls, v):
        return re.sub(r"\s+", "", v)


class TopUpRequest(BaseModel):
    amount: float = Field(..., gt=0, example=10000)


class FeePreviewResponse(BaseModel):
    amount: float
    fee: float
    fee_pct: float
    total_deducted: float


# ─── Loans ─────────────────────────────────────────────────────

class LoanApplyRequest(BaseModel):
    amount: float = Field(..., gt=0, example=5000)
    term_days: int = Field(..., example=14)

    @validator("term_days")
    def valid_term(cls, v):
        if v not in [7, 14, 30]:
            raise ValueError("Loan term must be 7, 14, or 30 days")
        return v


class LoanResponse(BaseModel):
    id: str
    principal: float
    interest: float
    total_owed: float
    status: str
    term_days: int
    due_date: datetime
    repaid_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class LoanPreviewResponse(BaseModel):
    principal: float
    interest: float
    interest_pct: float
    total_owed: float
    due_date: datetime
    eligible: bool
    max_eligible_amount: float
    rejection_reason: Optional[str] = None


# ─── Transactions ───────────────────────────────────────────────

class TransactionResponse(BaseModel):
    id: str
    type: str
    status: str
    amount: float
    fee: float
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    page: int
    per_page: int


# ─── Platform Config ────────────────────────────────────────────

class ConfigResponse(BaseModel):
    transfer_fee_pct: float
    loan_interest_pct: float
    max_loan_amount: float
    min_transfer_amount: float
    min_loan_amount: float
    total_revenue: float

    class Config:
        from_attributes = True


class ConfigUpdateRequest(BaseModel):
    transfer_fee_pct: float = Field(..., ge=0, le=20, example=1.5)
    loan_interest_pct: float = Field(..., ge=0, le=50, example=10.0)
    max_loan_amount: float = Field(..., ge=1000, example=50000)


# ─── Generic responses ──────────────────────────────────────────

class SuccessResponse(BaseModel):
    success: bool = True
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
