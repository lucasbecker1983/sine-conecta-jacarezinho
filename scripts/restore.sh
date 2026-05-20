#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="/opt/saas_sine"
ENV_FILE="$ROOT_DIR/.env"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/backup.log"
BACKUP_FILE="${1:-}"
CONFIRMATION="${2:-}"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

log() {
  mkdir -p "$LOG_DIR"
  printf '%s %s\n' "$(date -Is)" "$*" >> "$LOG_FILE"
}

if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then
  echo "Uso: $0 /opt/saas_sine/backups/sine-conecta-YYYYmmdd-HHMMSS.tar.gz RESTAURAR_SINE_CONECTA" >&2
  exit 1
fi

if [[ "$CONFIRMATION" != "RESTAURAR_SINE_CONECTA" ]]; then
  echo "Operacao destrutiva. Reexecute informando RESTAURAR_SINE_CONECTA para confirmar." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo .env nao encontrado em $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
PG_RESTORE_URL="${DATABASE_URL/postgresql+psycopg:/postgresql:}"

log "WARN iniciando restauracao destrutiva $BACKUP_FILE"
tar -xzf "$BACKUP_FILE" -C "$WORK_DIR"

if ! pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$PG_RESTORE_URL" "$WORK_DIR/database.dump" >> "$LOG_FILE" 2>&1; then
  log "ERROR pg_restore falhou"
  echo "Falha ao restaurar banco. Consulte $LOG_FILE" >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/uploads"
tar -xzf "$WORK_DIR/uploads.tar.gz" -C "$ROOT_DIR"
chown -R www-data:www-data "$ROOT_DIR/uploads" || true

log "INFO restauracao concluida $BACKUP_FILE"
echo "Restauracao concluida."
