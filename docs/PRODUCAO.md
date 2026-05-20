# Produção

## Backend

```bash
cd /opt/saas_sine/backend
. .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 18743
```

Em produção use systemd:

```bash
systemctl restart saas-sine-backend
systemctl status saas-sine-backend --no-pager
```

## Frontend

```bash
cd /opt/saas_sine/frontend
npm install
npm run build
```

O Nginx serve `/opt/saas_sine/frontend/dist`.

## Logs

```bash
journalctl -u saas-sine-backend -n 100 --no-pager
tail -f /opt/saas_sine/logs/backend.log
tail -f /opt/saas_sine/logs/error.log
tail -f /opt/saas_sine/logs/security.log
```

## Health e OpenAPI

```bash
curl http://127.0.0.1:18743/api/health
curl http://127.0.0.1:18743/api/openapi.json
```

## LGPD avançado

Rotas públicas:

```bash
curl http://127.0.0.1:18743/api/lgpd/public/terms
```

Rotas internas exigem token:

```bash
curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:18743/api/lgpd/dashboard
curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:18743/api/lgpd/requests
```

No frontend:

- `/privacidade/direitos`;
- `/privacidade/solicitacao`;
- `/trabalhador/privacidade`;
- `/empresa/privacidade`;
- `/lgpd`.

## Nginx e SSL

```bash
nginx -t
systemctl reload nginx
certbot renew --dry-run
```

## Backup e restore

```bash
bash /opt/saas_sine/scripts/backup.sh
bash /opt/saas_sine/scripts/restore.sh /opt/saas_sine/backups/ARQUIVO.tar.gz RESTAURAR_SINE_CONECTA
```

## Testes

```bash
cd /opt/saas_sine/backend
. .venv/bin/activate
python3 -m compileall app
python3 -m pytest -q
coverage run -m pytest
coverage report

cd /opt/saas_sine/frontend
npm run test
npm run build
```

## Checklist antes de uso real

- Login por perfil validado.
- Portal público de vagas abrindo em HTTPS.
- Trabalhador consegue iniciar candidatura a partir de vaga.
- Empresa vê apenas candidatos encaminhados.
- SINE acessa triagem e relatórios.
- Exportação CSV registra auditoria.
- Painel `/lgpd` abre para perfis SINE autorizados.
- Solicitação pública LGPD registra evento `created`.
- Encaminhamento oficial cria registro em `lgpd_data_sharing_records`.
- Backup manual criado e logado.
- `nginx -t` sem erro.
- `systemctl status saas-sine-backend` ativo.
