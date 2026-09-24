FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.lock ./requirements.lock

RUN python -m pip install --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.lock

COPY . .

CMD ["sh", "-c", "python -m alembic -c alembic.ini upgrade head && exec uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port ${PORT:-8000}"]