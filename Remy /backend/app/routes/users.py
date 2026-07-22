"""
app/routes/users.py
────────────────────
User profile endpoints:
  GET  /users/me          → current user profile + balance
  GET  /users/me/balance  → wallet balance + loan eligibility
  PUT  /users/me/pin      → change PIN
  GET  /users/search      → find user by phone (for send money)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_pin, verify_pin
from app.models.models import User
from app.models.schemas import UserResponse, UserBalanceResponse, SuccessResponse
from app.services.finance_service import get_max_loan_for_user

router = APIRouter(prefix="/users", tags=["Users"])


# ─── Profile ──────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/me/balance", response_model=UserBalanceResponse)
def get_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get balance + max loan amount user is eligible for."""
    return UserBalanceResponse(
        balance=current_user.balance,
        credit_score=current_user.credit_score,
        max_loan_eligible=get_max_loan_for_user(current_user, db),
    )


# ─── Change PIN ───────────────────────────────────────────────

class ChangePINRequest(BaseModel):
    current_pin: str
    new_pin: str

@router.put("/me/pin", response_model=SuccessResponse)
def change_pin(
    body: ChangePINRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_pin(body.current_pin, current_user.pin_hash):
        raise HTTPException(400, "Current PIN is incorrect")
    if len(body.new_pin) < 4 or not body.new_pin.isdigit():
        raise HTTPException(400, "New PIN must be 4–6 digits")

    current_user.pin_hash = hash_pin(body.new_pin)
    db.commit()
    return SuccessResponse(message="PIN changed successfully")


# ─── Search user by phone (for send-money screen) ─────────────

@router.get("/search")
def search_user(
    phone: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Look up a user by phone number.
    Used to confirm the recipient's name before sending money.
    Only returns name + provider (not balance or PIN).
    """
    user = db.query(User).filter(User.phone == phone.replace(" ", "")).first()
    if not user:
        return {"found": False, "name": None}
    return {
        "found": True,
        "name": user.name,
        "provider": user.provider,
    }
