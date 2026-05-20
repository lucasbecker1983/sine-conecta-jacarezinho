# Backup e Restauração

## Backup manual

```bash
bash /opt/saas_sine/scripts/backup.sh
```

O script carrega `/opt/saas_sine/.env`, gera dump PostgreSQL com `pg_dump`, compacta `uploads/` e salva o pacote em `/opt/saas_sine/backups/`.

## Agendamento sugerido

```cron
0 2 * * * /opt/saas_sine/scripts/backup.sh
```

## Retenção

São mantidos os 7 backups locais mais recentes. O log fica em `/opt/saas_sine/logs/backup.log`.

## Restauração

A restauração é destrutiva para o banco atual:

```bash
bash /opt/saas_sine/scripts/restore.sh /opt/saas_sine/backups/ARQUIVO.tar.gz RESTAURAR_SINE_CONECTA
```

## Cuidados LGPD

Backups contêm currículos e dados pessoais. Restrinja acesso, não envie por canais abertos e mantenha cópias fora do repositório Git.
