"""
app/core/database.py
─────────────────────
Sets up the SQLAlchemy database connection.
Works with SQLite (dev) and PostgreSQL (production) —
just change DATABASE_URL in .env.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────
# SQLite needs check_same_thread=False; PostgreSQL ignores it
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,   # prints SQL queries in dev (set DEBUG=false in prod)
)

# ── Session factory ───────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Base class for all models ─────────────────────────────────
Base = declarative_base()


# ── Dependency: get a DB session per request ──────────────────
# Use this in every route with:  db: Session = Depends(get_db)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
