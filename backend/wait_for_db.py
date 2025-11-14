#!/usr/bin/env python3
"""
Script to wait for the database server to be ready.
This connects to the 'postgres' database (which always exists) to verify the server is up.
"""

import os
import time
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

print("--- Wait for DB Script ---")

try:
    DB_USER = os.environ["POSTGRES_USER"]
    DB_PASSWORD = os.environ["POSTGRES_PASSWORD"]
    DB_NAME = os.environ["POSTGRES_DB"]
    DB_HOST = os.environ.get("DB_HOST", "db")
    DB_PORT = os.environ.get("DB_PORT", "5432")

    # Connect to 'postgres' database to verify server is up
    # (The target database might not exist yet, but 'postgres' always does)
    POSTGRES_DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
    
    retries = 20  # Increased retries for CloudSQL connections
    initial_wait = 2
    max_wait = 10
    wait_seconds = initial_wait
    
    print(f"Waiting for PostgreSQL server at {DB_HOST}:{DB_PORT}...")
    print(f"Target database: {DB_NAME}")
    print(f"User: {DB_USER}")
    print(f"Will retry up to {retries} times...")
    
    attempt = 0
    while retries > 0:
        attempt += 1
        try:
            engine = create_engine(
                POSTGRES_DB_URL,
                connect_args={"connect_timeout": 5}  # 5 second connection timeout
            )
            with engine.connect() as conn:
                # Simple query to verify connection
                conn.execute(text("SELECT 1"))
            print(f"✅ Database server connection successful! (Attempt {attempt})")
            engine.dispose()
            sys.exit(0)  # Success
        except OperationalError as e:
            error_msg = str(e)
            # Provide more helpful error messages
            if "could not translate host name" in error_msg.lower():
                print(f"⚠️  Attempt {attempt}: Cannot resolve host '{DB_HOST}'. Is the database service running?")
            elif "connection refused" in error_msg.lower():
                print(f"⚠️  Attempt {attempt}: Connection refused. Server may still be starting up...")
            elif "timeout" in error_msg.lower():
                print(f"⚠️  Attempt {attempt}: Connection timeout. Network may be slow or server busy...")
            elif "authentication failed" in error_msg.lower():
                print(f"⚠️  Attempt {attempt}: Authentication failed. Check POSTGRES_USER and POSTGRES_PASSWORD.")
            elif "password authentication failed" in error_msg.lower():
                print(f"⚠️  Attempt {attempt}: Password authentication failed. Check credentials.")
            else:
                print(f"⚠️  Attempt {attempt}: Database not ready (Error: {error_msg[:100]})")
            
            retries -= 1
            if retries > 0:
                print(f"   Waiting {wait_seconds}s before next attempt ({retries} retries remaining)...")
                time.sleep(wait_seconds)
                # Exponential backoff with max limit
                wait_seconds = min(wait_seconds * 1.2, max_wait)
            else:
                print(f"\n❌ Could not connect to database server after {attempt} attempts.")
                print(f"   Host: {DB_HOST}:{DB_PORT}")
                print(f"   User: {DB_USER}")
                print(f"   Last error: {error_msg}")
                print("\n   Troubleshooting:")
                print("   - Verify the database service is running")
                print("   - Check network connectivity to the database host")
                print("   - Verify DB_HOST, DB_PORT, POSTGRES_USER, and POSTGRES_PASSWORD are correct")
                if "cloud-sql-proxy" in DB_HOST:
                    print("   - If using CloudSQL, verify cloud-sql-proxy is running and connected")
                sys.exit(1)  # Failure

except KeyError as e:
    print(f"❌ Missing required environment variable: {e}")
    print("   Required variables: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB")
    print("   Optional variables: DB_HOST (default: 'db'), DB_PORT (default: '5432')")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {type(e).__name__}: {e}")
    sys.exit(1)