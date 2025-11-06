import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# --- START OF PRODUCTION-READY CONFIG ---
# 1. Get database credentials from environment variables
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_NAME = os.getenv("POSTGRES_DB")

# 2. Get host and port.
#    In production (Coolify), we'll set DB_HOST to "cloud-sql-proxy".
#    Locally, this will default to "db" (your docker-compose service name).
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")

# 3. Build the database URL
#    postgresql://<user>:<password>@<host>:<port>/<dbname>
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# --- END OF PRODUCTION-READY CONFIG ---

# Load environment variables from .env file
# load_dotenv()

# SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# # Create the SQLAlchemy engine
# engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)
# Create a SessionLocal class. Each instance of a SessionLocal class will be a database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class. Our ORM models will inherit from this class.
Base = declarative_base()

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()