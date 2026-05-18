#!/usr/bin/env bash
set -e

ROOT_DIR="/opt/saas_sine"
BACKEND_DIR="$ROOT_DIR/backend"

if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "Arquivo .env nao encontrado. Execute scripts/generate_env.sh primeiro."
  exit 1
fi

cd "$BACKEND_DIR"
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
alembic upgrade head
python -m app.seed

echo "Backend instalado e migrations aplicadas."
