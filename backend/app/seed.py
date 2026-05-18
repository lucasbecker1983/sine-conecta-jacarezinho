import secrets
import uuid

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.permissions import ROLE_PERMISSIONS
from app.core.security import hash_password
from app.models import Permission, Role, Tenant, User


def run_seed() -> None:
    db = SessionLocal()
    try:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == "jacarezinho"))
        if not tenant:
            tenant = Tenant(id=uuid.uuid4(), name="SINE Jacarezinho", slug="jacarezinho", city="Jacarezinho", state="PR", domain="sine.jacarezinho.cloud", logo_url="/assets/logos/sine-logo.png", primary_color="#14532d", secondary_color="#0f766e", accent_color="#f59e0b", footer_text="Prefeitura Municipal de Jacarezinho", is_active=True)
            db.add(tenant)
            db.flush()
        permission_cache = {permission.code: permission for permission in db.scalars(select(Permission)).all()}
        for role_name, permissions in ROLE_PERMISSIONS.items():
            role = db.scalar(select(Role).where(Role.name == role_name)) or Role(id=uuid.uuid4(), name=role_name, description=role_name)
            db.add(role)
            for code in permissions:
                if code == "*":
                    continue
                permission = permission_cache.get(code)
                if not permission:
                    permission = Permission(id=uuid.uuid4(), code=code, description=code)
                    permission_cache[code] = permission
                db.add(permission)
                if permission not in role.permissions:
                    role.permissions.append(permission)
        db.flush()
        created: list[tuple[str, str]] = []
        for email, name, role_name, tenant_id in [
            ("admin@sine.jacarezinho.cloud", "Administrador Master", "super_admin", None),
            ("gestor@sine.jacarezinho.cloud", "Gestor SINE Jacarezinho", "tenant_admin", tenant.id),
        ]:
            if not db.scalar(select(User).where(User.email == email)):
                password = secrets.token_urlsafe(18)
                user = User(id=uuid.uuid4(), tenant_id=tenant_id, email=email, full_name=name, password_hash=hash_password(password), is_active=True)
                role = db.scalar(select(Role).where(Role.name == role_name))
                user.roles.append(role)
                db.add(user)
                created.append((email, password))
        db.commit()
        if created:
            print("Credenciais iniciais geradas. Guarde agora; elas nao serao exibidas novamente:")
            for email, password in created:
                print(f"{email}: {password}")
        else:
            print("Seeds ja existentes; nenhuma senha nova foi gerada.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
