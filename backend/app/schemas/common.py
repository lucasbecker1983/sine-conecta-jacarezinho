from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    city: str
    state: str
    domain: str
    logo_url: str | None = None
    primary_color: str
    secondary_color: str
    accent_color: str
    footer_text: str
    is_active: bool


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID | None
    email: EmailStr
    full_name: str
    roles: list[str] = []


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut
    tenant: TenantOut | None


class CompanyIn(BaseModel):
    cnpj: str
    legal_name: str
    trade_name: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    district: str | None = None
    city: str | None = None
    state: str | None = None
    responsible_name: str | None = None
    segment: str | None = None
    notes: str | None = None


class CompanyOut(CompanyIn):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    created_at: datetime


class WorkerIn(BaseModel):
    cpf: str
    full_name: str
    birth_date: date | None = None
    phone: str | None = None
    whatsapp: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    district: str | None = None
    city: str | None = None
    state: str | None = None
    education_level: str | None = None
    desired_role: str | None = None
    desired_salary: str | None = None
    availability: str | None = None
    cnh: str | None = None
    has_disability: bool | None = None
    disability_notes: str | None = None
    notes: str | None = None
    lgpd_accepted: bool = False


class WorkerOut(WorkerIn):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    created_at: datetime


class WorkerProfileIn(BaseModel):
    cpf: str
    full_name: str
    birth_date: date | None = None
    phone: str | None = None
    whatsapp: str | None = None
    address: str | None = None
    district: str | None = None
    city: str | None = "Jacarezinho"
    state: str | None = "PR"
    education_level: str | None = None
    desired_role: str | None = None
    desired_salary: str | None = None
    availability: str | None = None
    cnh: str | None = None
    has_disability: bool | None = None
    disability_notes: str | None = None
    notes: str | None = None
    lgpd_accepted: bool = False


class JobIn(BaseModel):
    company_id: UUID
    title: str
    description: str
    vacancies: int = Field(default=1, ge=1)
    salary_range: str | None = None
    benefits: str | None = None
    workday: str | None = None
    schedule: str | None = None
    workplace: str | None = None
    modality: str = "presencial"
    minimum_education: str | None = None
    required_experience: str | None = None
    desired_courses: str | None = None
    cnh_required: str | None = None
    travel_required: bool = False
    contract_type: str | None = None
    notes: str | None = None
    closing_deadline: date | None = None
    status: str = "solicitada"


class JobOut(JobIn):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    created_at: datetime


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    worker_id: UUID
    original_filename: str
    size_bytes: int
    status: str
    analysis: dict | None = None
    created_at: datetime


class ReferralIn(BaseModel):
    job_id: UUID
    worker_id: UUID
    resume_id: UUID | None = None
    match_score: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None


class ReferralOut(ReferralIn):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    status: str
    created_at: datetime


class FeedbackIn(BaseModel):
    referral_id: UUID
    company_id: UUID
    status: str
    comments: str | None = None
