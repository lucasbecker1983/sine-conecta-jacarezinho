#!/usr/bin/env bash
set -e

ROOT_DIR="/opt/saas_sine"
DOMAIN="sine.jacarezinho.cloud"
SRC_CONF="$ROOT_DIR/nginx/${DOMAIN}.conf"
AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

if [ ! -f "$SRC_CONF" ]; then
  echo "Config Nginx nao encontrada em $SRC_CONF"
  exit 1
fi

cp "$SRC_CONF" "$AVAILABLE"
ln -sf "$AVAILABLE" "$ENABLED"
nginx -t
systemctl reload nginx

SERVER_IP="$(curl -fsS --max-time 5 https://api.ipify.org || true)"
DNS_IP="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}')"
echo "IP publico detectado: ${SERVER_IP:-indisponivel}"
echo "DNS ${DOMAIN}: ${DNS_IP:-indisponivel}"

if [ -n "$SERVER_IP" ] && [ -n "$DNS_IP" ] && [ "$SERVER_IP" != "$DNS_IP" ]; then
  echo "DNS ainda nao aponta para este servidor. Certbot nao sera executado automaticamente."
  exit 0
fi

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
nginx -t
systemctl reload nginx
echo "SSL configurado para $DOMAIN."
