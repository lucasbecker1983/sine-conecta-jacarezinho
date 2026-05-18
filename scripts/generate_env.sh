#!/usr/bin/env bash
set -e

ROOT_DIR="/opt/saas_sine"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  BACKUP="$ENV_FILE.backup.$(date +%Y%m%d%H%M%S)"
  cp "$ENV_FILE" "$BACKUP"
  echo "Arquivo .env existente preservado em $BACKUP"
fi

find_free_port() {
  for port in 18743 19287 19631 20317 21443; do
    if ! ss -ltn | awk '{print $4}' | grep -q ":$port$"; then
      echo "$port"
      return
    fi
  done
  python3 - <<'PY'
import socket
s=socket.socket()
s.bind(("127.0.0.1",0))
print(s.getsockname()[1])
s.close()
PY
}

DB_PASSWORD="$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-32)"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
BACKEND_PORT="$(find_free_port)"

cat > "$ENV_FILE" <<EOF_ENV
DATABASE_URL=postgresql+psycopg://saas_sine_user:${DB_PASSWORD}@localhost:5432/saas_sine_db
POSTGRES_DB=saas_sine_db
POSTGRES_USER=saas_sine_user
POSTGRES_PASSWORD=${DB_PASSWORD}

JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

APP_NAME="SINE Conecta Jacarezinho"
APP_ENV=production
APP_DOMAIN=sine.jacarezinho.cloud
APP_URL=https://sine.jacarezinho.cloud
CORS_ORIGINS=https://sine.jacarezinho.cloud

BACKEND_HOST=127.0.0.1
BACKEND_PORT=${BACKEND_PORT}

UPLOAD_DIR=/opt/saas_sine/uploads
LOG_DIR=/opt/saas_sine/logs

TENANT_DEFAULT_SLUG=jacarezinho
EOF_ENV

chown root:www-data "$ENV_FILE" 2>/dev/null || true
chmod 640 "$ENV_FILE"
echo ".env gerado com BACKEND_PORT=${BACKEND_PORT}"
