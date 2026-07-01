#!/bin/bash
set -e

echo "Running database migrations..."
cd /app
python -c "
from alembic.config import Config
from alembic import command

cfg = Config('alembic.ini')
command.upgrade(cfg, 'head')
print('Migrations complete.')
"

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
