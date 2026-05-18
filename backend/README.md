# Backend

API FastAPI do SINE Conecta Jacarezinho.

Comandos principais:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 127.0.0.1 --port ${BACKEND_PORT:-18743}
```
