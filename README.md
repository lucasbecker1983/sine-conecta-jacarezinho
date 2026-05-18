# SINE Conecta Jacarezinho

Plataforma SaaS GovTech para intermediação de mão de obra do SINE de Jacarezinho/PR, preparada desde o início para multi-tenant e white label.

## Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, Canvas.
- Backend: Python, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, JWT, RBAC.
- Banco: PostgreSQL.
- Publicação: Nginx, Certbot e systemd.

## Estrutura

```text
/opt/saas_sine
├── backend
├── frontend
├── nginx
├── scripts
├── systemd
├── uploads/resumes
├── logs
└── docs
```

## Instalação

```bash
cd /opt/saas_sine
scripts/generate_env.sh
scripts/setup_postgres.sh
scripts/install_backend.sh
scripts/install_frontend.sh
```

O seed cria o tenant `SINE Jacarezinho` e usuários iniciais. As senhas são geradas e exibidas uma única vez no terminal.

## Backend

```bash
cd /opt/saas_sine/backend
. .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port $(grep BACKEND_PORT ../.env | cut -d= -f2)
```

Health check:

```bash
curl http://127.0.0.1:PORTA/api/health
```

## Frontend

```bash
cd /opt/saas_sine/frontend
npm install
npm run build
```

O build é servido pelo Nginx a partir de `/opt/saas_sine/frontend/dist`.

## Nginx e SSL

```bash
cd /opt/saas_sine
scripts/setup_nginx_ssl.sh
```

Antes do Certbot, confirme que `sine.jacarezinho.cloud` aponta para este servidor e que as portas 80 e 443 estão liberadas.

## Systemd

```bash
cp /opt/saas_sine/systemd/saas-sine-backend.service /etc/systemd/system/saas-sine-backend.service
systemctl daemon-reload
systemctl enable saas-sine-backend
systemctl restart saas-sine-backend
```

Logs:

```bash
journalctl -u saas-sine-backend -f
tail -f /opt/saas_sine/logs/backend.log
```

## Acesso

URL final: `https://sine.jacarezinho.cloud`

Usuários iniciais:

- `admin@sine.jacarezinho.cloud`
- `gestor@sine.jacarezinho.cloud`

As senhas são geradas no seed e não ficam hardcoded.

## Troubleshooting

- Backend não sobe: verifique `.env`, `journalctl -u saas-sine-backend -n 100` e conexão PostgreSQL.
- Frontend não carrega API: confirme proxy `/api/` no Nginx e `BACKEND_PORT`.
- SSL falha: confirme DNS, firewall, `nginx -t` e tente `certbot renew --dry-run`.
- Upload falha: confirme permissões em `/opt/saas_sine/uploads/resumes` e limite de 20 MB.
