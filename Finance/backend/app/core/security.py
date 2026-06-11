"""
app/core/security.py
─────────────────────
PIN hashing and JWT token logic.
- PINs are hashed with bcrypt (never stored as plain text)
- Login returns a JWT token the frontend stores and sends on every request
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── PIN hashing ───────────────────────────────────────────────
# bcrypt automatically salts and hashes; verify_pin() handles comparison
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_pin(plain_pin: str) -> str:
    """Hash a PIN before storing it in the database."""
    return pwd_context.hash(plain_pin)


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Check a plain PIN against the stored hash."""
    return pwd_context.verify(plain_pin, hashed_pin)


# ── JWT tokens ────────────────────────────────────────────────

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT token containing the user's ID.
    The frontend stores this and sends it as:
        Authorization: Bearer <token>
    on every protected request.
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(user_id),   # subject = user id
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode and validate a JWT token.
    Returns the user_id (string) or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub")
    except JWTError:
        return None
