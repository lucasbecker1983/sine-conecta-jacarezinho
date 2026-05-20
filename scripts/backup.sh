#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="/opt/saas_sine"
ENV_FILE="$ROOT_DIR/.env"
BACKUP_DIR="$ROOT_DIR/backups"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/backup.log"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

log() {
  mkdir -p "$LOG_DIR"
  printf '%s %s\n' "$(date -Is)" "$*" >> "$LOG_FILE"
}

if [[ ! -f "$ENV_FILE" ]]; then
  log "ERROR .env nao encontrado"
  echo "Arquivo .env nao encontrado em $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR" "$LOG_DIR"
DB_DUMP="$WORK_DIR/database.dump"
UPLOADS_TAR="$WORK_DIR/uploads.tar.gz"
CONFIGS_TAR="$WORK_DIR/configs.tar.gz"
FINAL_BACKUP="$BACKUP_DIR/sine-conecta-$TIMESTAMP.tar.gz"
PG_DUMP_URL="${DATABASE_URL/postgresql+psycopg:/postgresql:}"

log "INFO iniciando backup $FINAL_BACKUP"

if ! pg_dump --format=custom --no-owner --no-privileges --file="$DB_DUMP" "$PG_DUMP_URL" >> "$LOG_FILE" 2>&1; then
  log "ERROR pg_dump falhou"
  echo "Falha ao gerar dump do PostgreSQL. Consulte $LOG_FILE" >&2
  exit 1
fi

tar -czf "$UPLOADS_TAR" -C "$ROOT_DIR" uploads
tar -czf "$CONFIGS_TAR" -C "$ROOT_DIR" .env.example nginx systemd scripts docs README.md RELATORIO_FINAL.md
tar -czf "$FINAL_BACKUP" -C "$WORK_DIR" database.dump uploads.tar.gz configs.tar.gz

find "$BACKUP_DIR" -maxdepth 1 -name 'sine-conecta-*.tar.gz' -type f -printf '%T@ %p\n' \
  | sort -rn \
  | awk 'NR>7 {print $2}' \
  | xargs -r rm -f

log "INFO backup concluido $FINAL_BACKUP"
echo "$FINAL_BACKUP"
