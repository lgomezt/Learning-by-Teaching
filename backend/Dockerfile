# /backend/Dockerfile

FROM python:3.11-slim
WORKDIR /app

# Copy requirements from the backend subdir
COPY backend/requirements.txt ./

RUN pip install -r requirements.txt

# Copy the backend source code from the backend subdir
COPY backend/ .

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Expose the port Gunicorn will run on
EXPOSE 8000

# This is the command that will be run by "exec $@"
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]