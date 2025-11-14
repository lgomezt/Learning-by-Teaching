#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Entrypoint Script ---"
echo "Waiting for database server to be ready..."

# First, wait for the database server to be accessible
# We'll connect to 'postgres' database for this check
python /app/wait_for_db.py

echo "Database server is ready. Ensuring database exists..."
# Create the database if it doesn't exist
# (This file was copied into /app by your Dockerfile's 'COPY backend/ .')
python /app/create_db.py

echo "Database is ready. Running migrations..."
alembic upgrade head
echo "✅ Migrations complete."

echo "Starting Gunicorn server..."
# Now, execute the main command (the Gunicorn CMD from your Dockerfile)
exec "$@"