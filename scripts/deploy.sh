#!/usr/bin/env bash
set -e

ROOT_DIR="/opt/saas_sine"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  scripts/generate_env.sh
else
  echo ".env existente sera reutilizado."
fi

scripts/setup_postgres.sh
scripts/install_backend.sh
scripts/install_frontend.sh

set -a
# shellcheck disable=SC1091
. "$ROOT_DIR/.env"
set +a

sed "s/PORTA_BACKEND/${BACKEND_PORT}/g" "$ROOT_DIR/nginx/sine.jacarezinho.cloud.conf.template" > "$ROOT_DIR/nginx/sine.jacarezinho.cloud.conf"
cp "$ROOT_DIR/systemd/saas-sine-backend.service" /etc/systemd/system/saas-sine-backend.service
chown -R www-data:www-data "$ROOT_DIR/uploads" "$ROOT_DIR/logs"
systemctl daemon-reload
systemctl enable saas-sine-backend
systemctl restart saas-sine-backend
scripts/setup_nginx_ssl.sh

echo "Deploy finalizado."
