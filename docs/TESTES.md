# Testes

## Backend

```bash
cd /opt/saas_sine/backend
. .venv/bin/activate
python3 -m pytest -q
coverage run -m pytest
coverage report
```

Cobertura atual: 72% geral no backend, medida em 20/05/2026 com `coverage report`.

## Frontend

```bash
cd /opt/saas_sine/frontend
npm run test
npm run build
```

## Testes manuais críticos

- Login válido e inválido.
- Portal público `/vagas`.
- Cadastro/candidatura do trabalhador a partir de uma vaga.
- Bloqueio de empresa com feedback pendente.
- Triagem SINE por vaga.
- IA interna do SINE.
- Empresa vendo apenas encaminhados.
- Relatórios e exportação CSV por perfil.
- Status interno `/sistema/status`.
- Backup manual.
