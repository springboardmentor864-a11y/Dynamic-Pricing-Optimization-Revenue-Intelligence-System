# Multi-stage Dockerfile for PricePilot AI Production Deployment
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
RUN pip install --no-cache-dir --prefix=/install flasgger Flask-Limiter gunicorn

# Production Image
FROM python:3.11-slim

WORKDIR /app

# Copy installed python packages from builder
COPY --from=builder /install /usr/local

# Copy application codebase
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    FLASK_APP=app:create_app \
    PORT=5000

# Expose port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Launch production server via Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "app:create_app()"]
