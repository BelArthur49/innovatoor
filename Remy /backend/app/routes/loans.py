"""
app/routes/loans.py
────────────────────
Loan endpoints:
  GET  /loans/preview        → preview loan terms before applying
  GET  /loans/eligibility    → check if user can borrow
  POST /loans/apply          → apply for a loan
  GET  /loans/active         → get current active loan
  POST /loans/repay          → repay active loan
  GET  /loans/history        → all past loans
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import (
    User, Loan, LoanStatus, Transaction,
    TransactionType, TransactionStatus
)
from app.models.schemas import (
    LoanApplyRequest, LoanResponse, LoanPreviewResponse, SuccessResponse
)
from app.services.finance_service import (
    calc_loan_interest, calc_loan_due_date,
    check_loan_eligibility, update_credit_score,
    add_revenue, get_max_loan_for_user, get_config
)
from app.services.momo_service import momo

router = APIRouter(prefix="/loans", tags=["Loans"])


# ─── Loan Preview ─────────────────────────────────────────────

@router.get("/preview", response_model=LoanPreviewResponse)
def loan_preview(
    amount: float = Query(..., gt=0),
    term_days: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Preview loan terms (interest, due date, eligibility).
    Call this when user types the loan amount to show them the breakdown.
    """
    if term_days not in [7, 14, 30]:
        raise HTTPException(400, "Term must be 7, 14, or 30 days")

    config     = get_config(db)
    interest   = calc_loan_interest(amount, db)
    due_date   = calc_loan_due_date(term_days)
    eligibility = check_loan_eligibility(current_user, amount, db)

    return LoanPreviewResponse(
        principal=amount,
        interest=interest,
        interest_pct=config.loan_interest_pct,
        total_owed=amount + interest,
        due_date=due_date,
        eligible=eligibility["eligible"],
        max_eligible_amount=eligibility["max_amount"],
        rejection_reason=eligibility.get("reason") if not eligibility["eligible"] else None,
    )


# ─── Eligibility Check ────────────────────────────────────────

@router.get("/eligibility")
def check_eligibility(
    amount: float = Query(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quick eligibility check for a given amount."""
    result = check_loan_eligibility(current_user, amount, db)
    result["max_amount"] = get_max_loan_for_user(current_user, db)
    return result


# ─── Apply for Loan ───────────────────────────────────────────

@router.post("/apply", response_model=LoanResponse, status_code=201)
def apply_for_loan(
    body: LoanApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply for a micro loan.

    Flow:
    1. Check eligibility (credit score, no existing loan)
    2. Calculate interest
    3. Disburse via mobile money API (or credit wallet directly)
    4. Create Loan record
    5. Log transaction
    """
    # ── Eligibility ───────────────────────────────────────────
    eligibility = check_loan_eligibility(current_user, body.amount, db)
    if not eligibility["eligible"]:
        raise HTTPException(400, eligibility["reason"])

    # ── Calculate terms ───────────────────────────────────────
    interest   = calc_loan_interest(body.amount, db)
    total_owed = body.amount + interest
    due_date   = calc_loan_due_date(body.term_days)

    # ── Disburse money ────────────────────────────────────────
    # Option A: Credit the in-app wallet (user can then send/use within app)
    # Option B: Push to their mobile money number directly
    # We do Option A here; switch to momo.disburse() for Option B
    current_user.balance += body.amount

    # ── Create loan record ────────────────────────────────────
    loan = Loan(
        user_id=current_user.id,
        principal=body.amount,
        interest=interest,
        total_owed=total_owed,
        status=LoanStatus.ACTIVE,
        term_days=body.term_days,
        due_date=due_date,
    )
    db.add(loan)

    # ── Log transaction ───────────────────────────────────────
    tx = Transaction(
        user_id=current_user.id,
        type=TransactionType.LOAN,
        status=TransactionStatus.COMPLETED,
        amount=body.amount,
        fee=interest,   # interest is the cost of the loan
        description=f"Micro loan — {body.term_days} days, due {due_date.strftime('%d %b %Y')}",
    )
    db.add(tx)

    db.commit()
    db.refresh(loan)
    return loan


# ─── Active Loan ──────────────────────────────────────────────

@router.get("/active", response_model=LoanResponse)
def get_active_loan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the user's current active loan, if any."""
    loan = db.query(Loan).filter(
        Loan.user_id == current_user.id,
        Loan.status == LoanStatus.ACTIVE
    ).first()

    if not loan:
        raise HTTPException(404, "No active loan found")
    return loan


# ─── Repay Loan ───────────────────────────────────────────────

@router.post("/repay", response_model=SuccessResponse)
def repay_loan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Repay the active loan.
    Deducts total_owed from wallet balance.
    Updates credit score based on whether repayment is on time.
    Platform earns the interest amount.
    """
    loan = db.query(Loan).filter(
        Loan.user_id == current_user.id,
        Loan.status == LoanStatus.ACTIVE
    ).first()

    if not loan:
        raise HTTPException(404, "No active loan to repay")

    if current_user.balance < loan.total_owed:
        raise HTTPException(
            400,
            f"Insufficient balance. You need {loan.total_owed:,.0f} RWF. "
            f"Your balance: {current_user.balance:,.0f} RWF. "
            f"Top up {loan.total_owed - current_user.balance:,.0f} RWF more."
        )

    # ── Determine if on time ──────────────────────────────────
    is_on_time = datetime.now(timezone.utc) <= loan.due_date
    credit_event = "loan_repay_ontime" if is_on_time else "loan_repay_late"

    # ── Deduct from wallet ────────────────────────────────────
    current_user.balance -= loan.total_owed

    # ── Mark loan repaid ──────────────────────────────────────
    loan.status    = LoanStatus.REPAID
    loan.repaid_at = datetime.now(timezone.utc)

    # ── Log transaction ───────────────────────────────────────
    tx = Transaction(
        user_id=current_user.id,
        type=TransactionType.REPAY,
        status=TransactionStatus.COMPLETED,
        amount=loan.total_owed,
        description=f"Loan repayment ({'on time ✓' if is_on_time else 'late'})",
    )
    db.add(tx)

    # ── Credit score + revenue ────────────────────────────────
    new_score = update_credit_score(current_user, credit_event, db)
    add_revenue(loan.interest, db)   # platform earns the interest

    db.commit()

    return SuccessResponse(
        message=f"Loan repaid! {'On-time bonus: +20 credit score 🎉' if is_on_time else f'Late repayment: {new_score} credit score'}"
    )


# ─── Loan History ─────────────────────────────────────────────

@router.get("/history", response_model=list[LoanResponse])
def loan_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """All loans (active + repaid) for the current user."""
    return db.query(Loan).filter(
        Loan.user_id == current_user.id
    ).order_by(Loan.created_at.desc()).all()
