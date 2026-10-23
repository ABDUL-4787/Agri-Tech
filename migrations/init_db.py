#!/usr/bin/env python3
"""
AgriGrade Database Initialization & Migration Script.
Creates tables and indexes on the configured DATABASE_URL (SQLite or Neon PostgreSQL).
"""
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import settings
from backend.app.database.session import engine, Base
from backend.app.models.report import Report, Acknowledgement

def run_migrations():
    print(f"Connecting to database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    print("Creating tables (reports, acknowledgements)...")
    Base.metadata.create_all(bind=engine)
    print("Database schema successfully synchronized!")

if __name__ == "__main__":
    run_migrations()
