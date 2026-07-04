FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Railway copies the repo root into /app.
# We copy requirements.txt into /app (flat), then copy backend/ into /app (flat).
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Flatten: copy backend/ contents so app/ ends up at /app/app/
# This matches what uvicorn app.main:app expects when WORKDIR is /app.
COPY backend/ .

RUN mkdir -p /data/uploads

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/health', timeout=5)"

CMD ["python", "migrate_and_start.py"]
