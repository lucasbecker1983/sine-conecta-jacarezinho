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
