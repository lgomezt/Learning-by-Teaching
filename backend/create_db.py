#!/usr/bin/env python3
"""
Script to create the database if it doesn't exist.
This connects to the 'postgres' database (which always exists) to create the target database.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError

print("--- Database Creation Script ---")

try:
    DB_USER = os.environ["POSTGRES_USER"]
    DB_PASSWORD = os.environ["POSTGRES_PASSWORD"]
    DB_NAME = os.environ["POSTGRES_DB"]
    DB_HOST = os.environ.get("DB_HOST", "db")
    DB_PORT = os.environ.get("DB_PORT", "5432")

    # Connect to the 'postgres' database (always exists) to check/create our target database
    POSTGRES_DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
    
    print(f"Connecting to PostgreSQL server at {DB_HOST}:{DB_PORT}...")
    print(f"Target database: {DB_NAME}")
    
    try:
        # Create engine for the postgres database
        engine = create_engine(POSTGRES_DB_URL, isolation_level="AUTOCOMMIT")
        
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                {"dbname": DB_NAME}
            )
            exists = result.fetchone() is not None
            
            if exists:
                print(f"✅ Database '{DB_NAME}' already exists.")
            else:
                print(f"Database '{DB_NAME}' does not exist. Creating...")
                # Create the database
                # Note: PostgreSQL doesn't allow parameterized database names in CREATE DATABASE
                # So we need to use string formatting, but DB_NAME comes from env var, so it's safe
                conn.execute(text(f'CREATE DATABASE "{DB_NAME}"'))
                print(f"✅ Database '{DB_NAME}' created successfully!")
        
        engine.dispose()
        sys.exit(0)  # Success
        
    except OperationalError as e:
        print(f"❌ Failed to connect to PostgreSQL server: {e}")
        print(f"   Make sure the database server is running and accessible at {DB_HOST}:{DB_PORT}")
        sys.exit(1)
    except ProgrammingError as e:
        print(f"❌ Database operation failed: {e}")
        print(f"   This might indicate insufficient permissions or a connection issue.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

except KeyError as e:
    print(f"❌ Missing required environment variable: {e}")
    print("   Required variables: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB")
    sys.exit(1)


