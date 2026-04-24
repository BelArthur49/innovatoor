"""
app/services/scheduler.py
──────────────────────────
Background tasks that run on a schedule.
Uses APScheduler (installed in requirements.txt).

Jobs:
  - Every day at midnight: mark loans as OVERDUE if past due_date
  - Every day at 8am: (TODO) send payment reminder SMS to users with loans due soon
"""

from datetime import datetime, timezone
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.models import Loan, LoanStatus, User
from app.services.finance_service import update_credit_score

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def mark_overdue_loans():
    """
    Run daily: find all ACTIVE loans past their due_date and mark OVERDUE.
    Apply credit score penalty to each affected user.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        overdue = db.query(Loan).filter(
            Loan.status == LoanStatus.ACTIVE,
            Loan.due_date < now
        ).all()

        for loan in overdue:
            loan.status = LoanStatus.OVERDUE
            user = db.query(User).filter(User.id == loan.user_id).first()
            if user:
                update_credit_score(user, "loan_overdue", db)
                logger.warning(f"Loan {loan.id} marked OVERDUE for user {user.phone}")

        db.commit()
        if overdue:
            logger.info(f"Marked {len(overdue)} loans as overdue")

    except Exception as e:
        logger.exception(f"Error in mark_overdue_loans: {e}")
    finally:
        db.close()


def start_scheduler():
    """Start all scheduled jobs. Called from main.py on startup."""
    scheduler.add_job(
        mark_overdue_loans,
        trigger="cron",
        hour=0, minute=5,   # run at 00:05 UTC every day
        id="mark_overdue_loans",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started")


def stop_scheduler():
    """Stop scheduler. Called from main.py on shutdown."""
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")
