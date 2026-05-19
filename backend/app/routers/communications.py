from fastapi import APIRouter, Depends

from app.core.permissions import require_permissions
from app.routers import crud
from app.schemas.common import CommunicationMessageOut, CommunicationThreadOut


router = APIRouter(tags=["communications"])

router.add_api_route(
    "/communication/threads",
    crud.list_sine_threads,
    methods=["GET"],
    response_model=list[CommunicationThreadOut],
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
router.add_api_route(
    "/communication/threads",
    crud.create_sine_thread,
    methods=["POST"],
    response_model=CommunicationThreadOut,
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
router.add_api_route(
    "/communication/threads/{thread_id}/messages",
    crud.list_sine_thread_messages,
    methods=["GET"],
    response_model=list[CommunicationMessageOut],
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
router.add_api_route(
    "/communication/threads/{thread_id}/messages",
    crud.create_sine_thread_message,
    methods=["POST"],
    response_model=CommunicationMessageOut,
    dependencies=[Depends(require_permissions("referrals:manage"))],
)
router.add_api_route(
    "/company-portal/communication/threads",
    crud.list_company_threads,
    methods=["GET"],
    response_model=list[CommunicationThreadOut],
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/communication/threads",
    crud.create_company_thread,
    methods=["POST"],
    response_model=CommunicationThreadOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/communication/threads/{thread_id}/messages",
    crud.list_company_thread_messages,
    methods=["GET"],
    response_model=list[CommunicationMessageOut],
    dependencies=[Depends(require_permissions("company:portal"))],
)
router.add_api_route(
    "/company-portal/communication/threads/{thread_id}/messages",
    crud.create_company_thread_message,
    methods=["POST"],
    response_model=CommunicationMessageOut,
    dependencies=[Depends(require_permissions("company:portal"))],
)
