# /backend/Dockerfile

FROM python:3.11-slim
WORKDIR /app

# Copy requirements from the backend subdir
COPY backend/requirements.txt ./

RUN pip install gunicorn
RUN pip install -r requirements.txt

# Copy the backend source code from the backend subdir
COPY backend/ .


EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]