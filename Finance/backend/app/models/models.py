"""
app/models/models.py
─────────────────────
All database tables defined as Python classes.
SQLAlchemy turns these into real SQL tables automatically.

Tables:
  - User         → registered users + wallet balance
  - Transaction  → every money movement (send, receive, loan, repay, fee)
  - Loan         → active and historical loans
  - Config       → operator-adjustable fee rates (stored in DB, not .env)
  - OTPCode      → one-time PINs for phone verification
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, Enum
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


# ─── Helpers ──────────────────────────────────────────────────

def now_utc():
    return datetime.now(timezone.utc)

def new_uuid():
    return str(uuid.uuid4())


# ─── Enums ────────────────────────────────────────────────────

class TransactionType(str, enum.Enum):
    SEND    = "send"
    RECEIVE = "receive"
    TOPUP   = "topup"
    LOAN    = "loan"
    REPAY   = "repay"
    FEE     = "fee"

class TransactionStatus(str, enum.Enum):
    PENDING   = "pending"
    COMPLETED = "completed"
    FAILED    = "failed"

class LoanStatus(str, enum.Enum):
    ACTIVE   = "active"
    REPAID   = "repaid"
    OVERDUE  = "overdue"

class MoMoProvider(str, enum.Enum):
    MTN    = "MTN"
    AIRTEL = "Airtel"
    ORANGE = "Orange"
    MPESA  = "M-Pesa"


# ─── User ─────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id           = Column(String, primary_key=True, default=new_uuid)
    name         = Column(String(120), nullable=False)
    phone        = Column(String(20), unique=True, nullable=False, index=True)
    pin_hash     = Column(String(200), nullable=False)   # bcrypt hash, never plain text
    provider     = Column(String(20), nullable=False)    # MTN, Airtel, etc.
    balance      = Column(Float, default=0.0, nullable=False)
    credit_score = Column(Integer, default=500, nullable=False)  # 300–850
    is_active    = Column(Boolean, default=True)
    is_verified  = Column(Boolean, default=False)        # phone OTP verified
    created_at   = Column(DateTime(timezone=True), default=now_utc)
    updated_at   = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    # Relationships (lazy loaded — only fetched when accessed)
    transactions = relationship("Transaction", back_populates="user", foreign_keys="Transaction.user_id")
    loans        = relationship("Loan", back_populates="user")
    otp_codes    = relationship("OTPCode", back_populates="user")

    def __repr__(self):
        return f"<User {self.phone} balance={self.balance}>"


# ─── Transaction ──────────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"

    id             = Column(String, primary_key=True, default=new_uuid)
    user_id        = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    to_user_id     = Column(String, ForeignKey("users.id"), nullable=True)   # null for topup/loan
    type           = Column(Enum(TransactionType), nullable=False)
    status         = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED)
    amount         = Column(Float, nullable=False)
    fee            = Column(Float, default=0.0)     # fee charged on this tx
    description    = Column(Text, nullable=True)
    reference      = Column(String(100), nullable=True)   # mobile money API reference
    momo_tx_id     = Column(String(200), nullable=True)   # ID from MTN/Airtel
    created_at     = Column(DateTime(timezone=True), default=now_utc, index=True)

    # Relationships
    user    = relationship("User", back_populates="transactions", foreign_keys=[user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])

    def __repr__(self):
        return f"<Transaction {self.type} {self.amount} RWF>"


# ─── Loan ─────────────────────────────────────────────────────

class Loan(Base):
    __tablename__ = "loans"

    id          = Column(String, primary_key=True, default=new_uuid)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    principal   = Column(Float, nullable=False)    # amount borrowed
    interest    = Column(Float, nullable=False)    # fee on the loan
    total_owed  = Column(Float, nullable=False)    # principal + interest
    status      = Column(Enum(LoanStatus), default=LoanStatus.ACTIVE)
    term_days   = Column(Integer, nullable=False)  # 7, 14, or 30 days
    due_date    = Column(DateTime(timezone=True), nullable=False)
    repaid_at   = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), default=now_utc)

    # Relationships
    user = relationship("User", back_populates="loans")

    def __repr__(self):
        return f"<Loan {self.principal} RWF status={self.status}>"


# ─── Platform Config ──────────────────────────────────────────
# Stored in DB so admin can change fees without redeploying

class PlatformConfig(Base):
    __tablename__ = "platform_config"

    id                  = Column(Integer, primary_key=True, default=1)
    transfer_fee_pct    = Column(Float, default=1.5)
    loan_interest_pct   = Column(Float, default=10.0)
    max_loan_amount     = Column(Float, default=50000)
    min_transfer_amount = Column(Float, default=100)
    min_loan_amount     = Column(Float, default=500)
    total_revenue       = Column(Float, default=0.0)   # cumulative fees earned
    updated_at          = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


# ─── OTP Codes ────────────────────────────────────────────────
# For SMS phone verification (6-digit code sent via Africa's Talking / Twilio)

class OTPCode(Base):
    __tablename__ = "otp_codes"

    id         = Column(String, primary_key=True, default=new_uuid)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    code       = Column(String(10), nullable=False)
    is_used    = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="otp_codes")
