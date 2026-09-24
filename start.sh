cat > start.sh <<'EOF'
#!/bin/sh
set -e

echo "Running database migrations..."
python -m alembic -c alembic.ini upgrade head

echo "Starting LATTICE API on port ${PORT:-8000}..."

exec uvicorn app.main:app \
  --app-dir apps/api \
  --host 0.0.0.0 \
  --port "${PORT:-8000}"
EOF