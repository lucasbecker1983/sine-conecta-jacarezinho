from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud
from app.schemas.common import ReferralOut, SineReferralOut


router = APIRouter(tags=["referrals"])

router.add_api_route(
    "/referrals",
    crud.create_referral,
    methods=["POST"],
    response_model=ReferralOut,
    dependencies=[Depends(require_permissions("referrals:manage"))],
)

router.add_api_route(
    "/referrals",
    crud.list_referrals,
    methods=["GET"],
    response_model=list[SineReferralOut],
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
