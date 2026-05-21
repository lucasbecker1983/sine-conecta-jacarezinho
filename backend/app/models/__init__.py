import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class Tenant(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "tenants"
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(80), unique=True, index=True, nullable=False
    )
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    primary_color: Mapped[str] = mapped_column(
        String(20), default="#14532d", nullable=False
    )
    secondary_color: Mapped[str] = mapped_column(
        String(20), default="#0f766e", nullable=False
    )
    accent_color: Mapped[str] = mapped_column(
        String(20), default="#f59e0b", nullable=False
    )
    footer_text: Mapped[str] = mapped_column(
        String(255), default="Prefeitura Municipal de Jacarezinho", nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Role(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "roles"
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    users: Mapped[list["User"]] = relationship(
        secondary="user_roles", back_populates="roles"
    )
    permissions: Mapped[list["Permission"]] = relationship(
        secondary="role_permissions", back_populates="roles"
    )


class Permission(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "permissions"
    code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    roles: Mapped[list[Role]] = relationship(
        secondary="role_permissions", back_populates="permissions"
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True
    )


class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tenants.id"), index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tenant: Mapped[Tenant | None] = relationship()
    roles: Mapped[list[Role]] = relationship(
        secondary="user_roles", back_populates="users", lazy="selectin"
    )


class Company(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "companies"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    cnpj: Mapped[str] = mapped_column(String(18), nullable=False)
    legal_name: Mapped[str] = mapped_column(String(180), nullable=False)
    trade_name: Mapped[str | None] = mapped_column(String(180))
    state_registration: Mapped[str | None] = mapped_column(String(40))
    federal_registration: Mapped[str | None] = mapped_column(String(40))
    phone: Mapped[str | None] = mapped_column(String(30))
    whatsapp: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(String(255))
    district: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(2))
    cep: Mapped[str | None] = mapped_column(String(10))
    responsible_name: Mapped[str | None] = mapped_column(String(160))
    hr_responsible_name: Mapped[str | None] = mapped_column(String(160))
    segment: Mapped[str | None] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text)
    lgpd_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    lgpd_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    __table_args__ = (
        UniqueConstraint("tenant_id", "cnpj", name="uq_company_tenant_cnpj"),
    )


class CompanyUser(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "company_users"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    position: Mapped[str | None] = mapped_column(String(100))


class Worker(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "workers"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    cpf: Mapped[str] = mapped_column(String(14), nullable=False)
    full_name: Mapped[str] = mapped_column(String(180), nullable=False)
    birth_date: Mapped[date | None] = mapped_column(Date)
    phone: Mapped[str | None] = mapped_column(String(30))
    whatsapp: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(String(255))
    district: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(2))
    education_level: Mapped[str | None] = mapped_column(String(120))
    desired_role: Mapped[str | None] = mapped_column(String(160))
    desired_salary: Mapped[str | None] = mapped_column(String(80))
    availability: Mapped[str | None] = mapped_column(String(160))
    cnh: Mapped[str | None] = mapped_column(String(20))
    has_disability: Mapped[bool | None] = mapped_column(Boolean)
    disability_notes: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    lgpd_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    lgpd_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_anonymized: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    anonymized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processing_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    processing_blocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    __table_args__ = (
        UniqueConstraint("tenant_id", "cpf", name="uq_worker_tenant_cpf"),
    )


class WorkerExperience(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "worker_experiences"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workers.id"), index=True, nullable=False
    )
    company_name: Mapped[str | None] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(160), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)


class WorkerEducation(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "worker_educations"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workers.id"), index=True, nullable=False
    )
    level: Mapped[str] = mapped_column(String(120), nullable=False)
    institution: Mapped[str | None] = mapped_column(String(180))
    completed: Mapped[bool] = mapped_column(Boolean, default=True)


class WorkerCourse(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "worker_courses"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workers.id"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    institution: Mapped[str | None] = mapped_column(String(180))
    hours: Mapped[int | None] = mapped_column(Integer)


class WorkerSkill(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "worker_skills"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workers.id"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)


class Resume(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "resumes"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workers.id"), index=True, nullable=False
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text)
    analysis: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(
        String(40), default="pendente_analise", nullable=False
    )


class ResumeBankEntry(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "resume_bank_entries"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workers.id"), index=True, nullable=False)
    resume_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("resumes.id"), index=True)
    source_job_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("jobs.id"), index=True)
    source_application_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    source_referral_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("referrals.id"), index=True)
    status: Mapped[str] = mapped_column(String(60), default="ativo", index=True, nullable=False)
    entry_reason: Mapped[str] = mapped_column(String(100), default="atualizacao_manual_sine", nullable=False)
    tags: Mapped[list | None] = mapped_column(JSON)
    desired_roles: Mapped[list | None] = mapped_column(JSON)
    desired_sectors: Mapped[list | None] = mapped_column(JSON)
    availability: Mapped[str | None] = mapped_column(String(160))
    city: Mapped[str | None] = mapped_column(String(100), index=True)
    education_level: Mapped[str | None] = mapped_column(String(120))
    experience_summary: Mapped[str | None] = mapped_column(Text)
    internal_notes: Mapped[str | None] = mapped_column(Text)
    ai_summary: Mapped[str | None] = mapped_column(Text)
    ai_keywords: Mapped[list | None] = mapped_column(JSON)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    updated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)


class ResumeBankAISuggestion(UUIDMixin, Base):
    __tablename__ = "resume_bank_ai_suggestions"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"), index=True, nullable=False)
    resume_bank_entry_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resume_bank_entries.id"), index=True, nullable=False)
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workers.id"), index=True, nullable=False)
    resume_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("resumes.id"), index=True)
    compatibility_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    compatibility_level: Mapped[str] = mapped_column(String(40), default="baixa", nullable=False)
    matched_requirements: Mapped[list | None] = mapped_column(JSON)
    missing_requirements: Mapped[list | None] = mapped_column(JSON)
    ai_explanation: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(60), default="pendente_revisao", index=True, nullable=False)
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    forwarded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Job(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "jobs"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    vacancies: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    salary_range: Mapped[str | None] = mapped_column(String(120))
    benefits: Mapped[str | None] = mapped_column(Text)
    workday: Mapped[str | None] = mapped_column(String(120))
    schedule: Mapped[str | None] = mapped_column(String(120))
    workplace: Mapped[str | None] = mapped_column(String(180))
    modality: Mapped[str] = mapped_column(
        String(30), default="presencial", nullable=False
    )
    minimum_education: Mapped[str | None] = mapped_column(String(120))
    required_experience: Mapped[str | None] = mapped_column(Text)
    desired_courses: Mapped[str | None] = mapped_column(Text)
    cnh_required: Mapped[str | None] = mapped_column(String(20))
    travel_required: Mapped[bool] = mapped_column(Boolean, default=False)
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    contract_type: Mapped[str | None] = mapped_column(String(80))
    notes: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    closing_deadline: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(
        String(50), default="solicitada", index=True, nullable=False
    )


class JobRequirement(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "job_requirements"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id"), index=True, nullable=False
    )
    requirement_type: Mapped[str] = mapped_column(String(80), nullable=False)
    value: Mapped[str] = mapped_column(String(180), nullable=False)
    weight: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


class Referral(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "referrals"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id"), index=True, nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workers.id"), index=True, nullable=False
    )
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("resumes.id"), index=True
    )
    referred_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(60), default="encaminhado", nullable=False
    )
    match_score: Mapped[int | None] = mapped_column(Integer)
    match_explanation: Mapped[str | None] = mapped_column(Text)
    feedback_status: Mapped[str | None] = mapped_column(String(80))
    referred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    triage_notes: Mapped[str | None] = mapped_column(Text)
    ai_analysis_json: Mapped[dict | None] = mapped_column(JSON)
    last_ai_analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    notes: Mapped[str | None] = mapped_column(Text)


class Interview(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "interviews"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    referral_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("referrals.id"), index=True, nullable=False
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(60), default="agendada")
    notes: Mapped[str | None] = mapped_column(Text)


class CompanyFeedback(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "company_feedback"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    referral_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("referrals.id"), index=True, nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(80), nullable=False)
    comments: Mapped[str | None] = mapped_column(Text)


class CompanyMessageThread(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "company_message_threads"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id"), index=True, nullable=False
    )
    job_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("jobs.id"), index=True)
    referral_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("referrals.id"), index=True
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), index=True
    )
    topic: Mapped[str] = mapped_column(
        String(60), default="comunicacao_interna", nullable=False
    )
    subject: Mapped[str] = mapped_column(String(180), nullable=False)
    status: Mapped[str] = mapped_column(
        String(40), default="aberta", index=True, nullable=False
    )
    priority: Mapped[str] = mapped_column(String(30), default="normal", nullable=False)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    company_last_read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    sine_last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CompanyMessage(UUIDMixin, Base):
    __tablename__ = "company_messages"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    thread_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("company_message_threads.id"), index=True, nullable=False
    )
    sender_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), index=True
    )
    sender_role: Mapped[str] = mapped_column(String(30), nullable=False)
    message_type: Mapped[str] = mapped_column(
        String(40), default="message", nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class LGPDConsent(UUIDMixin, Base):
    __tablename__ = "lgpd_consents"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workers.id"), index=True, nullable=False
    )
    consent_type: Mapped[str] = mapped_column(String(80), nullable=False)
    consent_text: Mapped[str] = mapped_column(Text, nullable=False)
    accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ip_address: Mapped[str | None] = mapped_column(String(80))
    user_agent: Mapped[str | None] = mapped_column(String(255))
    version: Mapped[str] = mapped_column(String(40), nullable=False)


class LGPDTermsVersion(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "lgpd_terms_versions"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    term_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    version: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)


class LGPDDataSubjectRequest(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "lgpd_data_subject_requests"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    requester_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    worker_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("workers.id"), index=True)
    company_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("companies.id"), index=True)
    requester_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    requester_name: Mapped[str] = mapped_column(String(180), nullable=False)
    requester_email: Mapped[str] = mapped_column(String(255), nullable=False)
    requester_document: Mapped[str | None] = mapped_column(String(40))
    request_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(60), default="aberta", index=True, nullable=False)
    priority: Mapped[str] = mapped_column(String(30), default="normal", nullable=False)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    response_text: Mapped[str | None] = mapped_column(Text)
    internal_notes: Mapped[str | None] = mapped_column(Text)
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    resolved_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class LGPDRequestEvent(UUIDMixin, Base):
    __tablename__ = "lgpd_request_events"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lgpd_data_subject_requests.id", ondelete="CASCADE"), index=True, nullable=False)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    previous_status: Mapped[str | None] = mapped_column(String(60))
    new_status: Mapped[str | None] = mapped_column(String(60))
    message: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LGPDConsentHistory(UUIDMixin, Base):
    __tablename__ = "lgpd_consent_history"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    worker_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("workers.id"), index=True)
    company_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("companies.id"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    term_version_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lgpd_terms_versions.id"), index=True, nullable=False)
    consent_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    consent_status: Mapped[str] = mapped_column(String(30), default="accepted", index=True, nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(80))
    user_agent: Mapped[str | None] = mapped_column(Text)
    legal_basis: Mapped[str | None] = mapped_column(String(80))
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LGPDDataSharingRecord(UUIDMixin, Base):
    __tablename__ = "lgpd_data_sharing_records"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workers.id"), index=True, nullable=False)
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), index=True, nullable=False)
    job_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("jobs.id"), index=True)
    referral_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("referrals.id"), index=True)
    shared_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    shared_with_company_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    data_categories: Mapped[dict | list | None] = mapped_column(JSON)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    legal_basis: Mapped[str] = mapped_column(String(80), nullable=False)
    shared_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)


class LGPDRetentionPolicy(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "lgpd_retention_policies"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    retention_days: Mapped[int] = mapped_column(Integer, nullable=False)
    action_after_retention: Mapped[str] = mapped_column(String(40), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)


class LGPDRetentionReview(UUIDMixin, Base):
    __tablename__ = "lgpd_retention_reviews"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    policy_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lgpd_retention_policies.id"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="pendente", index=True, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LGPDIncident(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "lgpd_incidents"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="registrado", index=True, nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reported_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    affected_data_categories: Mapped[dict | list | None] = mapped_column(JSON)
    affected_subjects_estimate: Mapped[int | None] = mapped_column(Integer)
    containment_actions: Mapped[str | None] = mapped_column(Text)
    notification_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notified_authority_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notified_subjects_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class LGPDProcessingActivity(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "lgpd_processing_activities"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    data_categories: Mapped[dict | list | None] = mapped_column(JSON)
    data_subjects: Mapped[dict | list | None] = mapped_column(JSON)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    legal_basis: Mapped[str] = mapped_column(String(80), nullable=False)
    retention_info: Mapped[str] = mapped_column(Text, nullable=False)
    sharing_info: Mapped[str | None] = mapped_column(Text)
    security_measures: Mapped[str | None] = mapped_column(Text)
    responsible_area: Mapped[str | None] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)


class AuditLog(UUIDMixin, Base):
    __tablename__ = "audit_logs"
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tenants.id"), index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), index=True
    )
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(120))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    details: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class DataAccessLog(UUIDMixin, Base):
    __tablename__ = "data_access_logs"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    accessed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), index=True
    )
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workers.id"), index=True
    )
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("resumes.id"), index=True
    )
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255))
    ip_address: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Notification(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "notifications"
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
