"""
app/routes/auth.py
───────────────────
Authentication endpoints:
  POST /auth/register  → create account
  POST /auth/login     → get JWT token
  POST /auth/verify    → verify phone with OTP (optional)
  GET  /auth/me        → get current user profile
"""

import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_pin, verify_pin, create_access_token
from app.core.dependencies import get_current_user
from app.models.models import User, OTPCode
from app.models.schemas import (
    RegisterRequest, LoginRequest, TokenResponse,
    UserResponse, OTPVerifyRequest, SuccessResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─── Register ─────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new FlowCash account.
    Returns a JWT token so the user is immediately logged in.
    """
    # Check phone not already taken
    existing = db.query(User).filter(User.phone == body.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This phone number is already registered."
        )

    new_user = User(
        name=body.name,
        phone=body.phone,
        pin_hash=hash_pin(body.pin),   # ← PIN never stored in plain text
        provider=body.provider,
        balance=0.0,
        credit_score=500,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Optional: send OTP to verify phone
    # _send_otp(new_user, db)

    token = create_access_token(new_user.id)
    return TokenResponse(
        access_token=token,
        user_id=new_user.id,
        name=new_user.name,
    )


# ─── Login ────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Log in with phone + PIN.
    Returns a JWT token to be stored by the frontend.
    """
    user = db.query(User).filter(User.phone == body.phone).first()

    # Use same error for wrong phone and wrong PIN (security best practice —
    # don't tell attackers which one was wrong)
    if not user or not verify_pin(body.pin, user.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or PIN."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact support."
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
    )


# ─── Get current user ─────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user


# ─── OTP Verification (phone number) ──────────────────────────

@router.post("/send-otp", response_model=SuccessResponse)
def send_otp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a 6-digit OTP to the user's registered phone number."""
    _send_otp(current_user, db)
    return SuccessResponse(message=f"OTP sent to {current_user.phone}")


@router.post("/verify-otp", response_model=SuccessResponse)
def verify_otp(
    body: OTPVerifyRequest,
    db: Session = Depends(get_db)
):
    """Verify phone number with the OTP code that was sent via SMS."""
    user = db.query(User).filter(User.phone == body.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = db.query(OTPCode).filter(
        OTPCode.user_id == user.id,
        OTPCode.code == body.code,
        OTPCode.is_used == False,
        OTPCode.expires_at > datetime.now(timezone.utc)
    ).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")

    otp.is_used = True
    user.is_verified = True
    db.commit()

    return SuccessResponse(message="Phone number verified successfully!")


# ─── Internal helper ──────────────────────────────────────────

def _send_otp(user: User, db: Session):
    """Generate and send an OTP code via SMS."""
    # Generate 6-digit code
    code = "".join(random.choices(string.digits, k=6))
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Invalidate old OTPs
    db.query(OTPCode).filter(OTPCode.user_id == user.id).update({"is_used": True})

    otp = OTPCode(user_id=user.id, code=code, expires_at=expires)
    db.add(otp)
    db.commit()

    # TODO: Call Africa's Talking / Twilio SMS API here
    # from app.services.sms_service import sms
    # sms.send(user.phone, f"Your FlowCash code is: {code}. Expires in 10 min.")

    # For development: print to console
    import logging
    logging.getLogger(__name__).info(f"[DEV OTP] {user.phone} → {code}")
