"""
app/routes/admin.py
────────────────────
Admin-only endpoints (protected by ADMIN_SECRET_KEY header):
  GET  /admin/config         → get fee config
  PUT  /admin/config         → update fee rates
  GET  /admin/stats          → platform revenue and user stats
  POST /webhooks/mtn         → MTN MoMo payment confirmation webhook
  POST /webhooks/airtel      → Airtel payment confirmation webhook
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.models.models import (
    User, Transaction, Loan, PlatformConfig,
    TransactionType, TransactionStatus, LoanStatus
)
from app.models.schemas import (
    ConfigResponse, ConfigUpdateRequest, SuccessResponse
)
from app.services.finance_service import get_config

router = APIRouter(tags=["Admin & Webhooks"])


# ─── Admin auth ───────────────────────────────────────────────

def verify_admin(x_admin_key: Optional[str] = Header(None)):
    """
    Simple admin authentication via a secret header.
    In production, consider IP allowlisting or OAuth for admin routes.
    """
    if x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(403, "Invalid admin key. Set X-Admin-Key header.")


# ─── Config ───────────────────────────────────────────────────

@router.get("/admin/config", response_model=ConfigResponse, dependencies=[Depends(verify_admin)])
def get_platform_config(db: Session = Depends(get_db)):
    """Get current fee configuration."""
    return get_config(db)


@router.put("/admin/config", response_model=ConfigResponse, dependencies=[Depends(verify_admin)])
def update_platform_config(
    body: ConfigUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update fee rates and loan limits.
    Changes take effect immediately on the next transaction.
    """
    config = get_config(db)
    config.transfer_fee_pct  = body.transfer_fee_pct
    config.loan_interest_pct = body.loan_interest_pct
    config.max_loan_amount   = body.max_loan_amount
    db.commit()
    db.refresh(config)
    return config


# ─── Platform Stats ───────────────────────────────────────────

@router.get("/admin/stats", dependencies=[Depends(verify_admin)])
def get_stats(db: Session = Depends(get_db)):
    """Dashboard stats for the platform operator."""
    config = get_config(db)

    total_users       = db.query(func.count(User.id)).scalar()
    verified_users    = db.query(func.count(User.id)).filter(User.is_verified == True).scalar()
    total_txns        = db.query(func.count(Transaction.id)).scalar()
    total_sent        = db.query(func.sum(Transaction.amount)).filter(
                            Transaction.type == TransactionType.SEND,
                            Transaction.status == TransactionStatus.COMPLETED
                        ).scalar() or 0
    active_loans      = db.query(func.count(Loan.id)).filter(Loan.status == LoanStatus.ACTIVE).scalar()
    total_loans_value = db.query(func.sum(Loan.principal)).scalar() or 0
    overdue_loans     = db.query(func.count(Loan.id)).filter(Loan.status == LoanStatus.OVERDUE).scalar()

    return {
        "users": {
            "total": total_users,
            "verified": verified_users,
        },
        "transactions": {
            "total": total_txns,
            "total_sent_rwf": round(total_sent, 2),
        },
        "loans": {
            "active": active_loans,
            "overdue": overdue_loans,
            "total_disbursed_rwf": round(total_loans_value, 2),
        },
        "revenue": {
            "total_rwf": round(config.total_revenue or 0, 2),
        },
        "config": {
            "transfer_fee_pct": config.transfer_fee_pct,
            "loan_interest_pct": config.loan_interest_pct,
        }
    }


# ─── MTN MoMo Webhook ─────────────────────────────────────────

@router.post("/webhooks/mtn", include_in_schema=False)
async def mtn_webhook(request: Request, db: Session = Depends(get_db)):
    """
    MTN calls this URL when a payment is approved or rejected.
    Set MTN_MOMO_CALLBACK_URL=https://yourapp.com/webhooks/mtn in .env

    MTN sends a JSON body like:
    {
      "referenceId": "...",
      "status": "SUCCESSFUL" | "FAILED",
      "financialTransactionId": "...",
      "amount": "5000",
      "currency": "RWF",
      "payer": { "partyId": "0780000001" }
    }
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON body")

    reference_id = body.get("referenceId") or body.get("externalId")
    status_str   = body.get("status", "").upper()

    # Find the pending transaction with this reference
    tx = db.query(Transaction).filter(
        Transaction.reference.contains(reference_id or ""),
        Transaction.status == TransactionStatus.PENDING
    ).first()

    if not tx:
        # Already processed or not found — return 200 so MTN doesn't retry
        return {"received": True}

    if status_str == "SUCCESSFUL":
        tx.status = TransactionStatus.COMPLETED
        tx.momo_tx_id = body.get("financialTransactionId")

        # Credit user balance for top-ups confirmed via webhook
        if tx.type == TransactionType.TOPUP:
            user = db.query(User).filter(User.id == tx.user_id).first()
            if user:
                user.balance += tx.amount

        db.commit()

    elif status_str == "FAILED":
        tx.status = TransactionStatus.FAILED
        # If it was a send/loan that was pending, refund
        if tx.type in [TransactionType.SEND]:
            user = db.query(User).filter(User.id == tx.user_id).first()
            if user:
                user.balance += tx.amount + tx.fee  # refund full amount
        db.commit()

    return {"received": True}


# ─── Airtel Webhook ───────────────────────────────────────────

@router.post("/webhooks/airtel", include_in_schema=False)
async def airtel_webhook(request: Request, db: Session = Depends(get_db)):
    """Airtel calls this when a payment is confirmed."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON body")

    # Airtel uses a different structure — adapt as needed
    transaction_id = body.get("transaction", {}).get("id")
    status_str     = body.get("transaction", {}).get("status", "").upper()

    tx = db.query(Transaction).filter(
        Transaction.momo_tx_id == transaction_id,
        Transaction.status == TransactionStatus.PENDING
    ).first()

    if not tx:
        return {"received": True}

    tx.status = TransactionStatus.COMPLETED if status_str == "TS" else TransactionStatus.FAILED

    if tx.type == TransactionType.TOPUP and tx.status == TransactionStatus.COMPLETED:
        user = db.query(User).filter(User.id == tx.user_id).first()
        if user:
            user.balance += tx.amount

    db.commit()
    return {"received": True}
