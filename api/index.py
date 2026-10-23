import os
import sys
from pathlib import Path

# Add project root to sys.path so backend module resolves cleanly in Vercel runtime
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure database tables exist on serverless cold start
from backend.app.database.session import init_db
try:
    init_db()
except Exception as e:
    # Graceful logging in serverless environment
    print("Database init note:", e)

from backend.app.main import app
