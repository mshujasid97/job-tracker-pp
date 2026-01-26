"""Database connection setup and session dependency injection.

This module configures the SQLAlchemy database engine and provides the get_db dependency
that FastAPI uses to inject database sessions into route handlers.

The dependency injection pattern (Depends(get_db)) ensures:
- Each request gets a fresh database session
- Sessions are properly closed after the request completes
- Transactions are managed automatically (SQLAlchemy handles commit/rollback)

Usage in route handlers:
    from fastapi import Depends
    from ..database import get_db
    
    @router.get("/items")
    async def get_items(db: Session = Depends(get_db)):
        # db is a fresh session for this request
        items = db.query(Item).all()
        return items
        # Session automatically closes after response
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from .config import settings

# Create database engine
# - Single engine instance for the entire application
# - PostgreSQL connection string comes from settings (config.py)
# - Pool management handles connection reuse for efficiency
engine = create_engine(settings.DATABASE_URL)

# Session factory: Creates new session instances when called
# - autocommit=False: Manual transaction control (explicit commit/rollback)
# - autoflush=False: Manual flush control (explicit session.flush())
# - bind: Associate sessions with our engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base: All ORM models inherit from this to get database mapping
# See models/user.py and models/application.py for examples
Base = declarative_base()


def get_db() -> Session:
    """Dependency injection function for database sessions in route handlers.

    FastAPI will call this function for each request to provide a database session.
    The session is automatically closed when the request completes (in the finally block).

    Usage:
        @router.get("/items")
        async def get_items(db: Session = Depends(get_db)):
            items = db.query(Item).all()
            return items

    Yields:
        Session: A new SQLAlchemy session for the current request
    """
    db = SessionLocal()
    try:
        # Yield the session to the route handler
        yield db
    finally:
        # Always close the session when the request completes
        # This ensures connections are returned to the pool and resources cleaned up
        db.close()