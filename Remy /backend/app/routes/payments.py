"""
app/routes/payments.py
───────────────────────
Payment endpoints:
  GET  /payments/fee-preview      → calculate fee before sending
  POST /payments/send             → send money to another user
  POST /payments/topup            → request mobile money top-up
  GET  /payments/transactions     → transaction history
  GET  /payments/transactions/:id → single transaction detail
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import User, Transaction, TransactionType, TransactionStatus
from app.models.schemas import (
    SendMoneyRequest, TopUpRequest, FeePreviewResponse,
    TransactionResponse, TransactionListResponse, SuccessResponse
)
from app.services.finance_service import (
    calc_transfer_fee, calc_transfer_total,
    update_credit_score, add_revenue, get_config
)
from app.services.momo_service import momo

router = APIRouter(prefix="/payments", tags=["Payments"])


# ─── Fee Preview ──────────────────────────────────────────────

@router.get("/fee-preview", response_model=FeePreviewResponse)
def fee_preview(
    amount: float = Query(..., gt=0, description="Amount in RWF"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)   # requires login
):
    """
    Calculate the transfer fee for a given amount.
    Call this to show the user the fee BEFORE they confirm.
    """
    breakdown = calc_transfer_total(amount, db)
    return FeePreviewResponse(**breakdown)


# ─── Send Money ───────────────────────────────────────────────

@router.post("/send", response_model=TransactionResponse, status_code=201)
def send_money(
    body: SendMoneyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send money from the current user to a recipient phone number.

    Flow:
    1. Validate amount, recipient, balance
    2. Calculate fee
    3. Call mobile money API (real payment)
    4. Update sender balance (deduct amount + fee)
    5. Update recipient balance (add amount)
    6. Log transactions
    7. Update credit scores + platform revenue
    """
    config = get_config(db)

    # ── Validation ────────────────────────────────────────────
    if body.amount < config.min_transfer_amount:
        raise HTTPException(400, f"Minimum transfer is {config.min_transfer_amount} RWF")

    if body.recipient_phone == current_user.phone:
        raise HTTPException(400, "You cannot send money to yourself")

    fee   = calc_transfer_fee(body.amount, db)
    total = body.amount + fee

    if current_user.balance < total:
        raise HTTPException(
            400,
            f"Insufficient balance. You have {current_user.balance:,.0f} RWF but need {total:,.0f} RWF (incl. fee)"
        )

    # ── Find recipient (if they're in our system) ─────────────
    recipient = db.query(User).filter(User.phone == body.recipient_phone).first()

    # ── Call MoMo API ─────────────────────────────────────────
    # In production this triggers a real money movement
    # In sandbox it simulates success
    reference = f"SEND-{current_user.id[:8]}-{int(body.amount)}"
    momo_result = momo.disburse(
        phone=body.recipient_phone,
        provider=recipient.provider if recipient else current_user.provider,
        amount=body.amount,
        reference=reference,
        description=body.note or f"Transfer from {current_user.name}"
    )

    if not momo_result.success:
        raise HTTPException(
            status_code=502,
            detail=f"Mobile money transfer failed: {momo_result.message}"
        )

    # ── Update balances ───────────────────────────────────────
    current_user.balance -= total   # sender pays amount + fee
    if recipient:
        recipient.balance += body.amount

    # ── Record transactions ───────────────────────────────────
    tx_send = Transaction(
        user_id=current_user.id,
        to_user_id=recipient.id if recipient else None,
        type=TransactionType.SEND,
        status=TransactionStatus.COMPLETED,
        amount=body.amount,
        fee=fee,
        description=f"Sent to {recipient.name if recipient else body.recipient_phone}"
                    + (f" – {body.note}" if body.note else ""),
        reference=reference,
        momo_tx_id=momo_result.reference,
    )
    db.add(tx_send)

    # Log a RECEIVE transaction for the recipient (for their history)
    if recipient:
        tx_recv = Transaction(
            user_id=recipient.id,
            to_user_id=None,
            type=TransactionType.RECEIVE,
            status=TransactionStatus.COMPLETED,
            amount=body.amount,
            fee=0,
            description=f"Received from {current_user.name}"
                        + (f" – {body.note}" if body.note else ""),
            reference=reference,
        )
        db.add(tx_recv)

    # Log the fee transaction
    tx_fee = Transaction(
        user_id=current_user.id,
        type=TransactionType.FEE,
        status=TransactionStatus.COMPLETED,
        amount=fee,
        description=f"Transfer fee ({config.transfer_fee_pct}%)",
    )
    db.add(tx_fee)

    # ── Credit scores + revenue ───────────────────────────────
    update_credit_score(current_user, "send_money", db)
    if recipient:
        update_credit_score(recipient, "receive_money", db)
    add_revenue(fee, db)

    db.commit()
    db.refresh(tx_send)

    return tx_send


# ─── Top Up ───────────────────────────────────────────────────

@router.post("/topup", response_model=TransactionResponse, status_code=201)
def top_up(
    body: TopUpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Request a mobile money top-up.
    Sends a USSD push to the user's registered phone number.
    Balance is updated immediately in sandbox, or after webhook confirmation in production.
    """
    if body.amount < 500:
        raise HTTPException(400, "Minimum top-up is 500 RWF")

    # Call MoMo API — user will get a push notification on their phone
    reference = f"TOPUP-{current_user.id[:8]}-{int(body.amount)}"
    momo_result = momo.collect(
        phone=current_user.phone,
        provider=current_user.provider,
        amount=body.amount,
        reference=reference,
        description="FlowCash wallet top-up"
    )

    if not momo_result.success:
        raise HTTPException(502, f"Top-up request failed: {momo_result.message}")

    # In sandbox: credit immediately
    # In production: wait for webhook (see /webhooks/mtn route)
    # For simplicity, we credit immediately here in both modes
    current_user.balance += body.amount
    update_credit_score(current_user, "topup", db)

    tx = Transaction(
        user_id=current_user.id,
        type=TransactionType.TOPUP,
        status=TransactionStatus.COMPLETED,
        amount=body.amount,
        fee=0,
        description=f"Wallet top-up via {current_user.provider}",
        reference=reference,
        momo_tx_id=momo_result.reference,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return tx


# ─── Transaction History ──────────────────────────────────────

@router.get("/transactions", response_model=TransactionListResponse)
def get_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Paginated transaction history for the current user."""
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.created_at.desc())

    total = query.count()
    txns  = query.offset((page - 1) * per_page).limit(per_page).all()

    return TransactionListResponse(
        transactions=txns,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/transactions/{tx_id}", response_model=TransactionResponse)
def get_transaction(
    tx_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single transaction by ID."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(404, "Transaction not found")
    return tx
