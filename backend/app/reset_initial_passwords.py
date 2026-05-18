import secrets

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import User


INITIAL_EMAILS = ["admin@sine.jacarezinho.cloud", "gestor@sine.jacarezinho.cloud"]


def reset_passwords() -> None:
    db = SessionLocal()
    try:
        print("Novas credenciais geradas. Guarde agora; elas nao serao exibidas novamente:")
        for email in INITIAL_EMAILS:
            user = db.scalar(select(User).where(User.email == email))
            if not user:
                print(f"{email}: usuario nao encontrado")
                continue
            password = secrets.token_urlsafe(18)
            user.password_hash = hash_password(password)
            print(f"{email}: {password}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    reset_passwords()
