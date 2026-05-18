# Arquitetura

A plataforma é composta por backend FastAPI, frontend React/Vite e PostgreSQL.

O backend expõe rotas REST em `/api`, usa SQLAlchemy 2.x, Alembic para migrations, JWT para autenticação e RBAC para autorização.

O frontend usa tenant atual para aplicar identidade visual e organiza a operação em dashboard, empresas, trabalhadores, currículos, vagas, encaminhamentos, relatórios, white label e painel master.

Nginx serve o frontend buildado e faz proxy reverso de `/api/` para o Uvicorn local.
