from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


REGIONAL_PR_CITIES = {
    "Jacarezinho",
    "Cambara",
    "Cambará",
    "Andira",
    "Andirá",
    "Bandeirantes",
    "Santo Antonio da Platina",
    "Santo Antônio da Platina",
    "Ribeirao Claro",
    "Ribeirão Claro",
    "Carlopolis",
    "Carlópolis",
    "Siqueira Campos",
    "Joaquim Tavora",
    "Joaquim Távora",
    "Ibaiti",
    "Wenceslau Braz",
    "Tomazina",
    "Pinhalão",
    "Quatigua",
    "Quatiguá",
    "Salto do Itarare",
    "Salto do Itararé",
    "Barra do Jacare",
    "Barra do Jacaré",
}

CommunicationTopic = Literal[
    "feedback_contratacao",
    "correcao_vaga",
    "agenda_entrevista",
    "duvida_perfil_requisitos",
    "solicitacao_novos_candidatos",
    "cancelamento_suspensao_vaga",
    "documentos_lgpd",
    "comunicacao_interna",
]


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


class ProfileUpdateIn(BaseModel):
    full_name: str = Field(min_length=3, max_length=160)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=7, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)
    confirm_password: str = Field(min_length=10, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_strong_password(cls, value: str) -> str:
        checks = [
            any(char.islower() for char in value),
            any(char.isupper() for char in value),
            any(char.isdigit() for char in value),
            any(not char.isalnum() for char in value),
        ]
        if sum(checks) < 3:
            raise ValueError("A nova senha deve combinar letras, numeros e simbolos")
        return value


class SineCollaboratorIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=3, max_length=160)
    role: Literal["sine_staff", "sine_manager", "tenant_admin"] = "sine_staff"
    is_active: bool = True


class SineCollaboratorPatchIn(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=3, max_length=160)
    role: Literal["sine_staff", "sine_manager", "tenant_admin"] | None = None
    is_active: bool | None = None


class SineCollaboratorOut(UserOut):
    is_active: bool
    last_login_at: datetime | None = None


class TemporaryPasswordOut(BaseModel):
    user_id: UUID
    temporary_password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=7, max_length=128)


class RefreshTokenIn(BaseModel):
    refresh_token: str = Field(min_length=20)


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
    state_registration: str | None = None
    federal_registration: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    district: str | None = None
    city: str | None = None
    state: str | None = None
    cep: str | None = None
    responsible_name: str | None = None
    hr_responsible_name: str | None = None
    segment: str | None = None
    notes: str | None = None
    lgpd_accepted: bool = False

    @field_validator("city")
    @classmethod
    def validate_regional_city(cls, value: str | None) -> str | None:
        if value and value not in REGIONAL_PR_CITIES:
            raise ValueError("Cidade fora da regiao atendida pelo SINE Jacarezinho")
        return value

    @field_validator("state")
    @classmethod
    def validate_pr_state(cls, value: str | None) -> str | None:
        if value and value.upper() != "PR":
            raise ValueError("Estado deve ser PR")
        return value.upper() if value else value


class CompanyOut(CompanyIn):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    created_at: datetime
    lgpd_accepted_at: datetime | None = None


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
    start_date: date | None = None
    closing_deadline: date | None = None
    status: str = "solicitada"


class JobOut(JobIn):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    created_at: datetime


class CompanyPortalJobIn(BaseModel):
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
    start_date: date | None = None
    closing_deadline: date | None = None


class CompanyPortalUserIn(BaseModel):
    email: EmailStr
    full_name: str
    position: str | None = "Responsavel pelo RH"


class CompanyPortalUserOut(BaseModel):
    user_id: UUID
    company_id: UUID
    email: EmailStr
    full_name: str
    temporary_password: str | None = None
    created: bool


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
    match_explanation: str | None = None
    created_at: datetime


class FeedbackIn(BaseModel):
    referral_id: UUID
    company_id: UUID
    status: str
    comments: str | None = None


class CompanyReferralOut(BaseModel):
    id: UUID
    job_id: UUID
    job_title: str
    worker_id: UUID
    worker_name: str
    worker_email: EmailStr | None = None
    worker_phone: str | None = None
    worker_whatsapp: str | None = None
    resume_id: UUID | None = None
    resume_filename: str | None = None
    status: str
    match_score: int | None = None
    notes: str | None = None
    created_at: datetime


class CompanyReferralFeedbackIn(BaseModel):
    status: str
    comments: str | None = None


class CommunicationThreadIn(BaseModel):
    company_id: UUID | None = None
    job_id: UUID | None = None
    referral_id: UUID | None = None
    topic: CommunicationTopic = "comunicacao_interna"
    subject: str = Field(min_length=3, max_length=180)
    body: str = Field(min_length=2, max_length=4000)
    priority: str = "normal"


class CommunicationMessageIn(BaseModel):
    body: str = Field(min_length=2, max_length=4000)


class CommunicationThreadOut(BaseModel):
    id: UUID
    company_id: UUID
    company_name: str
    job_id: UUID | None = None
    job_title: str | None = None
    referral_id: UUID | None = None
    worker_name: str | None = None
    resume_id: UUID | None = None
    resume_filename: str | None = None
    topic: str
    subject: str
    status: str
    priority: str
    last_message_at: datetime | None = None
    created_at: datetime


class CommunicationMessageOut(BaseModel):
    id: UUID
    thread_id: UUID
    sender_user_id: UUID | None = None
    sender_name: str | None = None
    sender_role: str
    message_type: str
    body: str
    details: dict | None = None
    created_at: datetime


class DataAccessLogOut(BaseModel):
    id: UUID
    accessed_by_user_id: UUID | None = None
    accessed_by_name: str | None = None
    worker_id: UUID | None = None
    worker_name: str | None = None
    resume_id: UUID | None = None
    resume_filename: str | None = None
    action: str
    reason: str | None = None
    ip_address: str | None = None
    created_at: datetime


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    message: str
    read_at: datetime | None = None
    created_at: datetime


class JobCandidateOut(BaseModel):
    worker_id: UUID
    worker_name: str
    worker_email: EmailStr | None = None
    worker_phone: str | None = None
    worker_whatsapp: str | None = None
    resume_id: UUID | None = None
    resume_filename: str | None = None
    application_status: str
    referral_id: UUID | None = None
    created_at: datetime | None = None
    has_lgpd_consent: bool
    city: str | None = None
    education: str | None = None
    desired_role: str | None = None
    ai_summary: str | None = None
    match_score: int | None = None
    match_explanation: str | None = None


class CandidateAnalysisOut(BaseModel):
    worker_id: UUID
    resume_id: UUID | None = None
    worker_name: str
    match_score: int
    match_level: Literal["alta", "media", "baixa"]
    summary: str
    skills: list[str] = []
    strengths: list[str] = []
    gaps: list[str] = []
    match_explanation: str
    suggested_interview_questions: list[str] = []


class JobCandidateAnalysisOut(BaseModel):
    job_id: UUID
    job_title: str
    disclaimer: str = (
        "A IA é apenas apoio à triagem. A decisão final é do colaborador do SINE."
    )
    candidates: list[CandidateAnalysisOut]


class ReferCandidateIn(BaseModel):
    worker_id: UUID
    resume_id: UUID | None = None
    match_score: int | None = Field(default=None, ge=0, le=100)
    match_explanation: str | None = None


class ReferCandidatesIn(BaseModel):
    candidates: list[ReferCandidateIn] = Field(min_length=1)
    message_to_company: str | None = None


class ReferCandidatesOut(BaseModel):
    status: str
    referred: int
    referral_ids: list[UUID]


class CandidateResumeDetailOut(BaseModel):
    worker: WorkerOut
    resume: ResumeOut | None = None
    extracted_text: str | None = None
    applications: list[dict] = []
    referrals: list[dict] = []
    access_logs: list[DataAccessLogOut] = []
