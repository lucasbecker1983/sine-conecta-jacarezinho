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


class PublicWorkerRegisterIn(BaseModel):
    full_name: str = Field(min_length=3, max_length=180)
    cpf: str = Field(min_length=11, max_length=14)
    birth_date: date | None = None
    phone: str = Field(min_length=8, max_length=30)
    whatsapp: str = Field(min_length=8, max_length=30)
    email: EmailStr
    city: str = "Jacarezinho"
    state: str = "PR"
    password: str = Field(min_length=10, max_length=128)
    confirm_password: str = Field(min_length=10, max_length=128)
    lgpd_accepted: bool
    job_id: UUID | None = None
    education_level: str | None = None
    desired_role: str | None = None
    cnh: str | None = None
    availability: str | None = None
    notes: str | None = None

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, value: str) -> str:
        digits = "".join(char for char in value if char.isdigit())
        if len(digits) != 11 or len(set(digits)) == 1:
            raise ValueError("CPF invalido")
        return digits

    @field_validator("state")
    @classmethod
    def validate_worker_state(cls, value: str) -> str:
        if value.upper() != "PR":
            raise ValueError("Estado deve ser PR")
        return value.upper()

    @field_validator("password")
    @classmethod
    def validate_worker_password(cls, value: str) -> str:
        checks = [
            any(char.islower() for char in value),
            any(char.isupper() for char in value),
            any(char.isdigit() for char in value),
            any(not char.isalnum() for char in value),
        ]
        if sum(checks) < 3:
            raise ValueError("A senha deve combinar letras, numeros e simbolos")
        return value


class PublicWorkerRegisterOut(TokenOut):
    job_id: UUID | None = None
    message: str


class CompanyIn(BaseModel):
    cnpj: str
    legal_name: str
    trade_name: str | None = None
    state_registration: str | None = None
    federal_registration: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    email: EmailStr | None = None
    site: str | None = None
    address: str | None = None
    address_number: str | None = None
    address_complement: str | None = None
    district: str | None = None
    city: str | None = None
    state: str | None = None
    cep: str | None = None
    responsible_name: str | None = None
    responsible_position: str | None = None
    responsible_email: EmailStr | None = None
    responsible_phone: str | None = None
    hr_responsible_name: str | None = None
    segment: str | None = None
    company_size: str | None = None
    cnae: str | None = None
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
    updated_at: datetime
    lgpd_accepted_at: datetime | None = None
    status: str = "ativa"
    profile_complete: bool = False
    approved_at: datetime | None = None
    blocked_at: datetime | None = None
    blocking_reason: str | None = None


class CompanyListItem(CompanyOut):
    open_jobs: int = 0
    total_jobs: int = 0
    pending_feedbacks: int = 0
    referrals_count: int = 0
    last_activity_at: datetime | None = None
    blocked: bool = False


class CompanyAdminUpdate(BaseModel):
    legal_name: str | None = None
    trade_name: str | None = None
    state_registration: str | None = None
    federal_registration: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    email: EmailStr | None = None
    site: str | None = None
    address: str | None = None
    address_number: str | None = None
    address_complement: str | None = None
    district: str | None = None
    city: str | None = None
    state: str | None = None
    cep: str | None = None
    responsible_name: str | None = None
    responsible_position: str | None = None
    responsible_email: EmailStr | None = None
    responsible_phone: str | None = None
    hr_responsible_name: str | None = None
    segment: str | None = None
    company_size: str | None = None
    cnae: str | None = None
    notes: str | None = None


class CompanyStatusUpdate(BaseModel):
    status: str
    reason: str | None = None


class CompanyInternalNoteCreate(BaseModel):
    note: str = Field(min_length=2, max_length=4000)


class CompanyJobSummary(BaseModel):
    id: UUID
    title: str
    status: str
    is_confidential: bool = False
    vacancies: int
    created_at: datetime
    closing_deadline: date | None = None
    pending_feedbacks: int = 0


class CompanyReferralSummary(BaseModel):
    id: UUID
    job_id: UUID
    job_title: str
    worker_id: UUID
    worker_name: str
    status: str
    feedback_status: str | None = None
    created_at: datetime
    referred_at: datetime | None = None


class CompanyFeedbackSummary(BaseModel):
    id: UUID | None = None
    referral_id: UUID
    job_title: str
    worker_name: str
    status: str
    comments: str | None = None
    pending: bool = False
    created_at: datetime | None = None


class CompanyAuditSummary(BaseModel):
    id: UUID
    action: str
    user_id: UUID | None = None
    details: dict | None = None
    created_at: datetime


class CompanySummary(BaseModel):
    open_jobs: int = 0
    closed_jobs: int = 0
    referrals_received: int = 0
    pending_feedbacks: int = 0
    hires_reported: int = 0
    days_since_last_return: int | None = None
    regularity_status: str
    blocking_reason: str | None = None


class CompanyDetailRead(CompanyOut):
    approved_by_user_id: UUID | None = None
    blocked_by_user_id: UUID | None = None
    internal_notes: str | None = None
    summary: CompanySummary
    jobs: list[CompanyJobSummary] = Field(default_factory=list)
    referrals: list[CompanyReferralSummary] = Field(default_factory=list)
    feedbacks: list[CompanyFeedbackSummary] = Field(default_factory=list)
    audit: list[CompanyAuditSummary] = Field(default_factory=list)


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
    is_confidential: bool = False
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


class SineJobOut(JobOut):
    company_name: str
    company_legal_name: str
    company_trade_name: str | None = None
    company_cnpj: str
    company_email: EmailStr | None = None
    company_phone: str | None = None
    company_whatsapp: str | None = None
    company_responsible_name: str | None = None


class PublicJobOut(BaseModel):
    id: UUID
    title: str
    company_name: str
    is_confidential: bool = False
    city: str | None = "Jacarezinho"
    state: str | None = "PR"
    vacancies: int
    salary_range: str | None = None
    workday: str | None = None
    modality: str
    minimum_education: str | None = None
    required_experience: str | None = None
    desired_courses: str | None = None
    cnh_required: str | None = None
    description: str
    benefits: str | None = None
    schedule: str | None = None
    workplace: str | None = None
    created_at: datetime
    expires_at: date | None = None


class WorkerPortalJobOut(BaseModel):
    id: UUID
    title: str
    description: str
    vacancies: int
    salary_range: str | None = None
    benefits: str | None = None
    workday: str | None = None
    schedule: str | None = None
    workplace: str | None = None
    modality: str
    minimum_education: str | None = None
    required_experience: str | None = None
    desired_courses: str | None = None
    cnh_required: str | None = None
    travel_required: bool = False
    contract_type: str | None = None
    status: str
    is_confidential: bool = False
    company_name: str
    city: str | None = "Jacarezinho"
    state: str | None = "PR"
    created_at: datetime
    closing_deadline: date | None = None


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
    is_confidential: bool = False
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


class SineReferralOut(BaseModel):
    id: UUID
    job_id: UUID
    job_title: str
    company_id: UUID
    company_name: str
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
    triage_notes: str | None = None
    created_at: datetime
    referred_at: datetime | None = None


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


class ResumeBankEntryCreate(BaseModel):
    worker_id: UUID
    resume_id: UUID | None = None
    source_job_id: UUID | None = None
    source_application_id: UUID | None = None
    source_referral_id: UUID | None = None
    status: str = "ativo"
    entry_reason: str = "atualizacao_manual_sine"
    tags: list[str] = Field(default_factory=list)
    desired_roles: list[str] = Field(default_factory=list)
    desired_sectors: list[str] = Field(default_factory=list)
    availability: str | None = None
    city: str | None = None
    education_level: str | None = None
    experience_summary: str | None = None
    internal_notes: str | None = None


class ResumeBankEntryUpdate(BaseModel):
    status: str | None = None
    entry_reason: str | None = None
    tags: list[str] | None = None
    desired_roles: list[str] | None = None
    desired_sectors: list[str] | None = None
    availability: str | None = None
    city: str | None = None
    education_level: str | None = None
    experience_summary: str | None = None
    internal_notes: str | None = None


class ResumeBankMoveRequest(BaseModel):
    worker_id: UUID | None = None
    resume_id: UUID | None = None
    job_id: UUID | None = None
    source_application_id: UUID | None = None
    referral_id: UUID | None = None
    entry_reason: str = "nao_contratado_em_processo"
    tags: list[str] = Field(default_factory=list)
    internal_notes: str | None = None


class ResumeBankStatusUpdate(BaseModel):
    status: str
    note: str | None = None


class ResumeBankEntryListItem(BaseModel):
    id: UUID
    worker_id: UUID
    worker_name: str
    worker_cpf_masked: str | None = None
    resume_id: UUID | None = None
    resume_filename: str | None = None
    status: str
    entry_reason: str
    tags: list[str] = Field(default_factory=list)
    desired_roles: list[str] = Field(default_factory=list)
    desired_sectors: list[str] = Field(default_factory=list)
    availability: str | None = None
    city: str | None = None
    education_level: str | None = None
    experience_summary: str | None = None
    ai_summary: str | None = None
    ai_keywords: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None = None


class ResumeBankEntryRead(ResumeBankEntryListItem):
    worker: WorkerOut
    resume: ResumeOut | None = None
    internal_notes: str | None = None
    source_job_id: UUID | None = None
    source_application_id: UUID | None = None
    source_referral_id: UUID | None = None


class ResumeBankAISuggestionRead(BaseModel):
    id: UUID
    job_id: UUID
    job_title: str
    resume_bank_entry_id: UUID
    worker_id: UUID
    worker_name: str
    resume_id: UUID | None = None
    resume_filename: str | None = None
    desired_role: str | None = None
    city: str | None = None
    education_level: str | None = None
    professional_summary: str | None = None
    compatibility_score: int
    compatibility_level: str
    matched_requirements: list[str] = Field(default_factory=list)
    missing_requirements: list[str] = Field(default_factory=list)
    ai_explanation: str | None = None
    status: str
    reviewed_at: datetime | None = None
    created_at: datetime
    forwarded_at: datetime | None = None


class ResumeBankAISuggestionReview(BaseModel):
    status: Literal["aprovado_pelo_sine", "recusado_pelo_sine"]
    note: str | None = None


class ResumeBankMatchRequest(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)


class ResumeBankMatchResult(BaseModel):
    job_id: UUID
    job_title: str
    total_suggestions: int
    suggestions: list[ResumeBankAISuggestionRead]


class WorkerResumeBankStatusOut(BaseModel):
    status: str | None = None
    entered_at: datetime | None = None
    updated_at: datetime | None = None
    desired_roles: list[str] = Field(default_factory=list)
    message: str


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
    source: str | None = None
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


LgpdRequesterType = Literal["worker", "company_user", "public", "internal"]
LgpdRequestType = Literal[
    "confirm_processing",
    "access_data",
    "correct_data",
    "anonymize_data",
    "block_data",
    "delete_data",
    "portability",
    "revoke_consent",
    "information_sharing",
    "review_automated_decision",
    "other",
]
LgpdRequestStatus = Literal[
    "aberta",
    "em_analise",
    "aguardando_confirmacao_identidade",
    "aguardando_area_responsavel",
    "deferida",
    "indeferida",
    "concluida",
    "cancelada",
]


class LgpdTermIn(BaseModel):
    term_type: str = Field(min_length=3, max_length=80)
    version: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=3, max_length=180)
    content: str = Field(min_length=10)
    summary: str | None = None
    is_active: bool = False


class LgpdTermPatchIn(BaseModel):
    version: str | None = Field(default=None, min_length=1, max_length=40)
    title: str | None = Field(default=None, min_length=3, max_length=180)
    content: str | None = Field(default=None, min_length=10)
    summary: str | None = None
    is_active: bool | None = None


class LgpdTermOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    term_type: str
    version: str
    title: str
    content: str
    summary: str | None = None
    is_active: bool
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class LgpdPublicRequestIn(BaseModel):
    requester_name: str = Field(min_length=3, max_length=180)
    requester_email: EmailStr
    requester_document: str | None = Field(default=None, max_length=40)
    requester_type: Literal["worker", "company_user", "public", "other"] = "public"
    request_type: LgpdRequestType
    description: str = Field(min_length=10, max_length=5000)
    confirmation: bool


class LgpdOwnRequestIn(BaseModel):
    request_type: LgpdRequestType
    description: str = Field(min_length=10, max_length=5000)


class LgpdRequestPatchIn(BaseModel):
    priority: Literal["baixa", "normal", "alta", "urgente"] | None = None
    internal_notes: str | None = None
    response_text: str | None = None


class LgpdRequestStatusIn(BaseModel):
    status: LgpdRequestStatus
    message: str | None = None


class LgpdRequestAssignIn(BaseModel):
    assigned_to_user_id: UUID
    message: str | None = None


class LgpdRequestResponseIn(BaseModel):
    response_text: str = Field(min_length=3)
    internal_notes: str | None = None


class LgpdCorrectionIn(BaseModel):
    entity_type: Literal["worker", "company"] = "worker"
    entity_id: UUID
    field: str = Field(min_length=2, max_length=80)
    old_value: str | None = None
    new_value: str | None = None
    reason: str = Field(min_length=5)


class LgpdJustificationIn(BaseModel):
    justification: str = Field(min_length=5)


class LgpdRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    requester_type: str
    worker_id: UUID | None = None
    company_id: UUID | None = None
    requester_user_id: UUID | None = None
    requester_name: str
    requester_email: EmailStr
    requester_document: str | None = None
    request_type: str
    description: str
    status: str
    priority: str
    due_date: datetime | None = None
    response_text: str | None = None
    internal_notes: str | None = None
    assigned_to_user_id: UUID | None = None
    resolved_by_user_id: UUID | None = None
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class LgpdRequestEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    request_id: UUID
    actor_user_id: UUID | None = None
    event_type: str
    previous_status: str | None = None
    new_status: str | None = None
    message: str | None = None
    metadata_json: dict | None = None
    created_at: datetime


class LgpdConsentOut(BaseModel):
    id: UUID
    consent_type: str
    consent_status: str
    term_title: str
    term_version: str
    legal_basis: str | None = None
    purpose: str
    accepted_at: datetime | None = None
    revoked_at: datetime | None = None
    created_at: datetime


class LgpdDataSharingOut(BaseModel):
    id: UUID
    worker_id: UUID
    company_id: UUID
    worker_name: str | None = None
    company_name: str | None = None
    job_id: UUID | None = None
    job_title: str | None = None
    referral_id: UUID | None = None
    data_categories: list[str] | dict | None = None
    purpose: str
    legal_basis: str
    shared_at: datetime
    revoked_at: datetime | None = None
    notes: str | None = None


class LgpdRetentionPolicyIn(BaseModel):
    entity_type: Literal["worker", "resume", "referral", "company", "communication", "audit_log", "data_access_log"]
    retention_days: int = Field(ge=1)
    action_after_retention: Literal["review", "anonymize", "delete", "archive"] = "review"
    is_active: bool = True


class LgpdRetentionPolicyPatchIn(BaseModel):
    retention_days: int | None = Field(default=None, ge=1)
    action_after_retention: Literal["review", "anonymize", "delete", "archive"] | None = None
    is_active: bool | None = None


class LgpdRetentionReviewResolveIn(BaseModel):
    status: Literal["revisado", "anonimizado", "mantido", "excluido", "arquivado"]
    reason: str | None = None


class LgpdIncidentIn(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=10)
    severity: Literal["baixa", "media", "alta", "critica"]
    detected_at: datetime | None = None
    affected_data_categories: list[str] | dict | None = None
    affected_subjects_estimate: int | None = Field(default=None, ge=0)
    containment_actions: str | None = None
    notification_required: bool = False


class LgpdIncidentPatchIn(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, min_length=10)
    severity: Literal["baixa", "media", "alta", "critica"] | None = None
    status: Literal["registrado", "em_investigacao", "contido", "comunicado", "encerrado"] | None = None
    affected_data_categories: list[str] | dict | None = None
    affected_subjects_estimate: int | None = Field(default=None, ge=0)
    containment_actions: str | None = None
    notification_required: bool | None = None
    notified_authority_at: datetime | None = None
    notified_subjects_at: datetime | None = None


class LgpdProcessingActivityIn(BaseModel):
    name: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=10)
    data_categories: list[str] | dict | None = None
    data_subjects: list[str] | dict | None = None
    purpose: str = Field(min_length=10)
    legal_basis: str = Field(min_length=3, max_length=80)
    retention_info: str = Field(min_length=3)
    sharing_info: str | None = None
    security_measures: str | None = None
    responsible_area: str | None = None
    is_active: bool = True


class LgpdProcessingActivityPatchIn(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, min_length=10)
    data_categories: list[str] | dict | None = None
    data_subjects: list[str] | dict | None = None
    purpose: str | None = Field(default=None, min_length=10)
    legal_basis: str | None = Field(default=None, min_length=3, max_length=80)
    retention_info: str | None = Field(default=None, min_length=3)
    sharing_info: str | None = None
    security_measures: str | None = None
    responsible_area: str | None = None
    is_active: bool | None = None
