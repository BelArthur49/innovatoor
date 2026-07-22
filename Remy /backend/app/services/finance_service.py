"""
app/services/finance_service.py
────────────────────────────────
Pure business logic:
  - Fee calculations
  - Credit score updates
  - Loan eligibility checks
  - Platform revenue tracking

No database access here — this is pure math/logic.
Routes call this service, then write the results to DB.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.models import PlatformConfig, User
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# Config helpers
# ──────────────────────────────────────────────────────────────

def get_config(db: Session) -> PlatformConfig:
    """Get platform config from DB (or create default if missing)."""
    config = db.query(PlatformConfig).filter(PlatformConfig.id == 1).first()
    if not config:
        config = PlatformConfig(
            id=1,
            transfer_fee_pct=settings.TRANSFER_FEE_PCT,
            loan_interest_pct=settings.LOAN_INTEREST_PCT,
            max_loan_amount=settings.MAX_LOAN_AMOUNT,
            min_transfer_amount=settings.MIN_TRANSFER_AMOUNT,
            min_loan_amount=settings.MIN_LOAN_AMOUNT,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


# ──────────────────────────────────────────────────────────────
# Transfer fee calculations
# ──────────────────────────────────────────────────────────────

def calc_transfer_fee(amount: float, db: Session) -> float:
    """
    Calculate the fee charged on a transfer.
    Fee = amount × transfer_fee_pct / 100
    Always rounded UP to nearest integer RWF.
    """
    config = get_config(db)
    fee = amount * config.transfer_fee_pct / 100
    return round(fee + 0.5)   # ceiling round


def calc_transfer_total(amount: float, db: Session) -> dict:
    """Return full breakdown for a transfer."""
    config = get_config(db)
    fee = calc_transfer_fee(amount, db)
    return {
        "amount": amount,
        "fee": fee,
        "fee_pct": config.transfer_fee_pct,
        "total_deducted": amount + fee,
    }


# ──────────────────────────────────────────────────────────────
# Loan calculations
# ──────────────────────────────────────────────────────────────

def calc_loan_interest(principal: float, db: Session) -> float:
    """
    Calculate interest on a loan.
    Interest = principal × loan_interest_pct / 100
    """
    config = get_config(db)
    interest = principal * config.loan_interest_pct / 100
    return round(interest + 0.5)   # ceiling round


def calc_loan_due_date(term_days: int) -> datetime:
    """Calculate when a loan is due."""
    return datetime.now(timezone.utc) + timedelta(days=term_days)


def get_max_loan_for_user(user: User, db: Session) -> float:
    """
    Calculate the maximum loan a user can take.
    Based on credit score (300–850) scaled against platform max.

    Formula: max = (credit_score / 850) × platform_max_loan
    A user with score 500 can borrow ~59% of the platform max.
    A user with score 850 can borrow 100%.
    """
    config = get_config(db)
    score_ratio = min(1.0, max(0.0, user.credit_score / 850))
    return round(score_ratio * config.max_loan_amount)


def check_loan_eligibility(user: User, amount: float, db: Session) -> dict:
    """
    Check if a user is eligible for a loan.
    Returns: { eligible: bool, reason: str, max_amount: float }
    """
    config = get_config(db)

    # Check for existing active loan
    from app.models.models import Loan, LoanStatus
    active_loan = db.query(Loan).filter(
        Loan.user_id == user.id,
        Loan.status == LoanStatus.ACTIVE
    ).first()

    if active_loan:
        return {
            "eligible": False,
            "reason": "You already have an active loan. Repay it first.",
            "max_amount": 0,
        }

    # Minimum credit score
    if user.credit_score < 450:
        return {
            "eligible": False,
            "reason": f"Credit score too low ({user.credit_score}). Minimum is 450. Transact more to improve.",
            "max_amount": 0,
        }

    max_amount = get_max_loan_for_user(user, db)

    if amount < config.min_loan_amount:
        return {
            "eligible": False,
            "reason": f"Minimum loan is {config.min_loan_amount} RWF.",
            "max_amount": max_amount,
        }

    if amount > max_amount:
        return {
            "eligible": False,
            "reason": f"Amount exceeds your current limit of {max_amount:,.0f} RWF.",
            "max_amount": max_amount,
        }

    return {"eligible": True, "reason": "", "max_amount": max_amount}


# ──────────────────────────────────────────────────────────────
# Credit score adjustments
# ──────────────────────────────────────────────────────────────

# Score changes for each action — tweak these to tune behavior
CREDIT_SCORE_EVENTS = {
    "send_money":       +3,
    "receive_money":    +2,
    "topup":            +1,
    "loan_repay_ontime":+20,
    "loan_repay_late":  -15,
    "loan_overdue":     -30,
}

def update_credit_score(user: User, event: str, db: Session) -> int:
    """
    Apply a credit score event to the user.
    Clamps between 300 (floor) and 850 (ceiling).
    Returns the new score.
    """
    delta = CREDIT_SCORE_EVENTS.get(event, 0)
    if delta == 0:
        logger.warning(f"Unknown credit score event: {event}")
        return user.credit_score

    new_score = max(300, min(850, user.credit_score + delta))
    user.credit_score = new_score
    db.commit()
    logger.info(f"Credit score {user.phone}: {user.credit_score - delta} → {new_score} ({event})")
    return new_score


# ──────────────────────────────────────────────────────────────
# Platform revenue
# ──────────────────────────────────────────────────────────────

def add_revenue(amount: float, db: Session):
    """Add earned fee to the platform's total revenue counter."""
    config = get_config(db)
    config.total_revenue = (config.total_revenue or 0) + amount
    db.commit()
