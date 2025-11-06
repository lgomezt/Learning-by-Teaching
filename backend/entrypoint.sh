#!/bin/sh

# This script runs database migrations and then starts the main application.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running database migrations..."
# This command runs your Alembic migrations
alembic upgrade head
echo "Migrations complete."

# Now, execute the main command (what was passed as CMD in the Dockerfile)
# This will be your "uvicorn app.main:app ..." or "gunicorn ..." command
exec "$@"