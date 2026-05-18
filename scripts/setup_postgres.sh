#!/usr/bin/env bash
set -e

ROOT_DIR="/opt/saas_sine"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo .env nao encontrado. Execute scripts/generate_env.sh primeiro."
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if ! id postgres >/dev/null 2>&1; then
  echo "Usuario postgres do sistema nao encontrado."
  exit 1
fi

PSQL_AS_POSTGRES=(sudo -u postgres psql)
if ! command -v sudo >/dev/null 2>&1; then
  PSQL_AS_POSTGRES=(runuser -u postgres -- psql)
fi

echo "Criando usuario e banco PostgreSQL quando necessario..."
"${PSQL_AS_POSTGRES[@]}" -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_USER}') THEN
    CREATE ROLE ${POSTGRES_USER} LOGIN PASSWORD '${POSTGRES_PASSWORD}';
  ELSE
    ALTER ROLE ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')\\gexec
GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};
SQL

echo "Banco ${POSTGRES_DB} pronto para o sistema."
