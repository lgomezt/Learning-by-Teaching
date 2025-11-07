import os
import time
import sys
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

print("--- Wait for DB Script ---")

try:
    DB_USER = os.environ["POSTGRES_USER"]
    DB_PASSWORD = os.environ["POSTGRES_PASSWORD"]
    DB_NAME = os.environ["POSTGRES_DB"]
    DB_HOST = os.environ.get("DB_HOST", "db")
    DB_PORT = os.environ.get("DB_PORT", "5432")

    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    retries = 15
    wait_seconds = 3
    
    print(f"Waiting for database at {DB_HOST}:{DB_PORT}...")
    
    while retries > 0:
        try:
            engine = create_engine(DATABASE_URL)
            engine.connect()
            print("✅ Database connection successful!")
            sys.exit(0)  # Success
        except OperationalError as e:
            print(f"Database not ready (Error: {e}). Waiting {wait_seconds}s...")
            retries -= 1
            time.sleep(wait_seconds)
            
    print("❌ Could not connect to database after all retries.")
    sys.exit(1)  # Failure

except KeyError as e:
    print(f"❌ Missing environment variable: {e}")
    sys.exit(1)