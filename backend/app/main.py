from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.routers import (
    ai_analysis,
    auth,
    communications,
    companies,
    company_portal,
    feedbacks,
    jobs,
    notifications,
    profile,
    public,
    referrals,
    reports,
    resumes,
    tenants,
    users,
    worker_portal,
    workers,
)

configure_logging()
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}


app.include_router(auth.router, prefix="/api")
app.include_router(public.router, prefix="/api")
app.include_router(tenants.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(workers.router, prefix="/api")
app.include_router(company_portal.router, prefix="/api")
app.include_router(worker_portal.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(referrals.router, prefix="/api")
app.include_router(feedbacks.router, prefix="/api")
app.include_router(communications.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")
app.include_router(ai_analysis.router, prefix="/api")
