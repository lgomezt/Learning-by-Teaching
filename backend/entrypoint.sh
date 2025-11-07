#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Entrypoint Script ---"
echo "Waiting for database to be ready..."

# Run the python wait script
# (This file was copied into /app by your Dockerfile's 'COPY backend/ .')
python /app/wait_for_db.py

echo "Database is ready. Running migrations..."
alembic upgrade head
echo "✅ Migrations complete."

echo "Starting Gunicorn server..."
# Now, execute the main command (the Gunicorn CMD from your Dockerfile)
exec "$@"