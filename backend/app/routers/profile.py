from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.core.security import hash_password, verify_and_upgrade_password
from app.models import User
from app.schemas.common import ChangePasswordIn, ProfileUpdateIn, UserOut
from app.services.audit import audit


router = APIRouter(prefix="/profile", tags=["profile"])


def serialize_user(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
        full_name=user.full_name,
        roles=[role.name for role in user.roles],
    )


@router.get("/me", response_model=UserOut)
def profile_me(user: User = Depends(get_current_user)):
    return serialize_user(user)


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.full_name = payload.full_name
    audit(
        db,
        user.tenant_id,
        user.id,
        "profile.update",
        "User",
        user.id,
        {"full_name": user.full_name},
        request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=400, detail="Confirmacao da nova senha nao confere"
        )
    valid, _ = verify_and_upgrade_password(payload.current_password, user.password_hash)
    if not valid:
        raise HTTPException(status_code=403, detail="Senha atual invalida")
    user.password_hash = hash_password(payload.new_password)
    audit(
        db,
        user.tenant_id,
        user.id,
        "profile.password.change",
        "User",
        user.id,
        {"refresh_tokens_invalidated": "stateless_tokens_rotate_on_next_login"},
        request.client.host if request.client else None,
    )
    db.commit()
    return {
        "status": "ok",
        "message": "Senha alterada. Entre novamente nos outros dispositivos para renovar a sessao.",
    }
