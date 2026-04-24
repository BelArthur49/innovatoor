"""
main.py
────────
FlowCash FastAPI Application Entry Point.

Run with:
    uvicorn main:app --reload --port 8000

API docs available at:
    http://localhost:8000/docs       ← Interactive Swagger UI
    http://localhost:8000/redoc      ← ReDoc documentation
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, payments, loans, users, admin
from app.services.scheduler import start_scheduler, stop_scheduler

# ── Logging setup ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s │ %(levelname)s │ %(name)s │ %(message)s",
)
logger = logging.getLogger("flowcash")


# ── Lifespan: startup + shutdown logic ────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ────────────────────────────────────────────────
    logger.info(f"Starting FlowCash API ({settings.APP_ENV})")

    # Create all database tables (safe — skips existing tables)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready")

    # Start background scheduler (overdue loan detection, etc.)
    start_scheduler()

    yield  # ← app is running here

    # ── SHUTDOWN ───────────────────────────────────────────────
    stop_scheduler()
    logger.info("FlowCash API shut down")


# ── App instance ──────────────────────────────────────────────
app = FastAPI(
    title="FlowCash API",
    description="""
    ## FlowCash – Mobile Money & Micro Loan Platform

    ### What this API does:
    - **Auth**: register, login with phone + PIN, get JWT token
    - **Payments**: send money (with fee), top-up wallet via MoMo
    - **Loans**: apply for micro loan, repay, credit score tracking
    - **Admin**: configure fee rates, view platform revenue
    - **Webhooks**: receive payment confirmations from MTN / Airtel

    ### Authentication:
    All protected routes require:
    ```
    Authorization: Bearer <your_jwt_token>
    ```
    Get a token from `POST /auth/login`.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ── CORS ──────────────────────────────────────────────────────
# Allows the PWA frontend to call this API from a different port/domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(payments.router)
app.include_router(loans.router)
app.include_router(admin.router)


# ── Root ──────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "environment": settings.APP_ENV,
    }


@app.get("/health", tags=["Health"])
def health():
    """Used by deployment platforms (Railway, Render) to check if app is alive."""
    return {"status": "ok"}
