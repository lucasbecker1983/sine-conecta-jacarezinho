# Deploy

Fluxo recomendado:

```bash
cd /opt/saas_sine
scripts/deploy.sh
```

O script:

1. gera `.env` se necessário;
2. cria banco e usuário PostgreSQL;
3. instala backend e roda migrations;
4. instala dependências do frontend e gera build;
5. instala serviço systemd;
6. configura Nginx;
7. tenta configurar SSL com Certbot se DNS apontar para o servidor.

Renovação SSL:

```bash
certbot renew
systemctl reload nginx
```
