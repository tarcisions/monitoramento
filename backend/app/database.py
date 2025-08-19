import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rpa_user:rpa_password@localhost:5432/rpa_monitor")

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool if "sqlite" in DATABASE_URL else None,
    echo=os.getenv("SQL_DEBUG") == "true"
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
