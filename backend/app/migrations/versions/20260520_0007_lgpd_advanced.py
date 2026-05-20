"""advanced LGPD governance module

Revision ID: 20260520_0007
Revises: 20260520_0006
Create Date: 2026-05-20
"""

from datetime import datetime, timezone
import json
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260520_0007"
down_revision = "20260520_0006"
branch_labels = None
depends_on = None


def _uuid_pk() -> sa.Column:
    return sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _timestamps() -> tuple[sa.Column, sa.Column]:
    return (
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def upgrade() -> None:
    op.add_column("workers", sa.Column("is_anonymized", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("workers", sa.Column("anonymized_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("workers", sa.Column("processing_blocked", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("workers", sa.Column("processing_blocked_at", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("workers", "is_anonymized", server_default=None)
    op.alter_column("workers", "processing_blocked", server_default=None)

    op.create_table(
        "lgpd_terms_versions",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("term_type", sa.String(80), nullable=False),
        sa.Column("version", sa.String(40), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_lgpd_terms_versions_tenant_id", "lgpd_terms_versions", ["tenant_id"])
    op.create_index("ix_lgpd_terms_versions_term_type", "lgpd_terms_versions", ["term_type"])
    op.create_index("ix_lgpd_terms_versions_is_active", "lgpd_terms_versions", ["is_active"])

    op.create_table(
        "lgpd_data_subject_requests",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("requester_type", sa.String(40), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=True),
        sa.Column("requester_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("requester_name", sa.String(180), nullable=False),
        sa.Column("requester_email", sa.String(255), nullable=False),
        sa.Column("requester_document", sa.String(40), nullable=True),
        sa.Column("request_type", sa.String(80), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(60), nullable=False, server_default="aberta"),
        sa.Column("priority", sa.String(30), nullable=False, server_default="normal"),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("response_text", sa.Text(), nullable=True),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("assigned_to_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("resolved_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        *_timestamps(),
    )
    for column in ["tenant_id", "requester_type", "worker_id", "company_id", "requester_user_id", "request_type", "status", "assigned_to_user_id", "resolved_by_user_id"]:
        op.create_index(f"ix_lgpd_data_subject_requests_{column}", "lgpd_data_subject_requests", [column])

    op.create_table(
        "lgpd_request_events",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lgpd_data_subject_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("previous_status", sa.String(60), nullable=True),
        sa.Column("new_status", sa.String(60), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ["tenant_id", "request_id", "actor_user_id", "event_type"]:
        op.create_index(f"ix_lgpd_request_events_{column}", "lgpd_request_events", [column])

    op.create_table(
        "lgpd_consent_history",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("term_version_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lgpd_terms_versions.id"), nullable=False),
        sa.Column("consent_type", sa.String(80), nullable=False),
        sa.Column("consent_status", sa.String(30), nullable=False, server_default="accepted"),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_address", sa.String(80), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("legal_basis", sa.String(80), nullable=True),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ["tenant_id", "worker_id", "company_id", "user_id", "term_version_id", "consent_type", "consent_status"]:
        op.create_index(f"ix_lgpd_consent_history_{column}", "lgpd_consent_history", [column])

    op.create_table(
        "lgpd_data_sharing_records",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id"), nullable=True),
        sa.Column("referral_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("referrals.id"), nullable=True),
        sa.Column("shared_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("shared_with_company_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("data_categories", sa.JSON(), nullable=True),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("legal_basis", sa.String(80), nullable=False),
        sa.Column("shared_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    for column in ["tenant_id", "worker_id", "company_id", "job_id", "referral_id", "shared_by_user_id", "shared_with_company_user_id"]:
        op.create_index(f"ix_lgpd_data_sharing_records_{column}", "lgpd_data_sharing_records", [column])

    op.create_table(
        "lgpd_retention_policies",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("entity_type", sa.String(80), nullable=False),
        sa.Column("retention_days", sa.Integer(), nullable=False),
        sa.Column("action_after_retention", sa.String(40), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        *_timestamps(),
    )
    for column in ["tenant_id", "entity_type", "is_active", "created_by_user_id"]:
        op.create_index(f"ix_lgpd_retention_policies_{column}", "lgpd_retention_policies", [column])

    op.create_table(
        "lgpd_retention_reviews",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("entity_type", sa.String(80), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("policy_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lgpd_retention_policies.id"), nullable=False),
        sa.Column("status", sa.String(40), nullable=False, server_default="pendente"),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("reviewed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ["tenant_id", "entity_type", "entity_id", "policy_id", "status", "reviewed_by_user_id"]:
        op.create_index(f"ix_lgpd_retention_reviews_{column}", "lgpd_retention_reviews", [column])

    op.create_table(
        "lgpd_incidents",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(30), nullable=False),
        sa.Column("status", sa.String(40), nullable=False, server_default="registrado"),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reported_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("affected_data_categories", sa.JSON(), nullable=True),
        sa.Column("affected_subjects_estimate", sa.Integer(), nullable=True),
        sa.Column("containment_actions", sa.Text(), nullable=True),
        sa.Column("notification_required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("notified_authority_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notified_subjects_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        *_timestamps(),
    )
    for column in ["tenant_id", "severity", "status", "reported_by_user_id", "closed_by_user_id"]:
        op.create_index(f"ix_lgpd_incidents_{column}", "lgpd_incidents", [column])

    op.create_table(
        "lgpd_processing_activities",
        _uuid_pk(),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("data_categories", sa.JSON(), nullable=True),
        sa.Column("data_subjects", sa.JSON(), nullable=True),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("legal_basis", sa.String(80), nullable=False),
        sa.Column("retention_info", sa.Text(), nullable=False),
        sa.Column("sharing_info", sa.Text(), nullable=True),
        sa.Column("security_measures", sa.Text(), nullable=True),
        sa.Column("responsible_area", sa.String(120), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        *_timestamps(),
    )
    op.create_index("ix_lgpd_processing_activities_tenant_id", "lgpd_processing_activities", ["tenant_id"])
    op.create_index("ix_lgpd_processing_activities_is_active", "lgpd_processing_activities", ["is_active"])

    _seed_jacarezinho()


def _seed_jacarezinho() -> None:
    bind = op.get_bind()
    tenant_id = bind.execute(sa.text("select id from tenants where slug = 'jacarezinho' limit 1")).scalar()
    if not tenant_id:
        return
    now = datetime.now(timezone.utc)
    terms = [
        ("worker_privacy_notice", "Aviso de Privacidade do Trabalhador", "Explica os dados tratados para cadastro, candidatura, triagem e encaminhamento pelo SINE."),
        ("company_privacy_notice", "Aviso de Privacidade da Empresa", "Explica o tratamento dos dados cadastrais e operacionais da empresa."),
        ("resume_processing_notice", "Termo de Tratamento de Currículo", "Autoriza o uso do currículo para triagem humana com apoio interno do SINE."),
        ("referral_sharing_notice", "Termo de Encaminhamento de Dados para Empresa", "Informa que dados do trabalhador só são enviados após encaminhamento oficial."),
        ("ai_internal_processing_notice", "Aviso sobre IA Interna do SINE", "A IA apoia a triagem interna e não decide contratação nem elimina candidatos automaticamente."),
        ("cookies_notice", "Política de Cookies", "Cookies essenciais podem ser usados para sessão, segurança e funcionamento do portal."),
    ]
    for term_type, title, summary in terms:
        bind.execute(
            sa.text(
                """
                insert into lgpd_terms_versions
                (id, tenant_id, term_type, version, title, content, summary, is_active, published_at, created_at, updated_at)
                values (:id, :tenant_id, :term_type, '1.0', :title, :content, :summary, true, :now, :now, :now)
                """
            ),
            {
                "id": uuid.uuid4(),
                "tenant_id": tenant_id,
                "term_type": term_type,
                "title": title,
                "content": summary + " Este texto inicial deve ser revisado pelo encarregado/DPO antes do uso definitivo.",
                "summary": summary,
                "now": now,
            },
        )
    policies = [
        ("resume", 365, "review"),
        ("worker", 730, "review"),
        ("referral", 1095, "archive"),
        ("audit_log", 1825, "archive"),
        ("data_access_log", 1825, "archive"),
    ]
    for entity_type, days, action in policies:
        bind.execute(
            sa.text(
                """
                insert into lgpd_retention_policies
                (id, tenant_id, entity_type, retention_days, action_after_retention, is_active, created_at, updated_at)
                values (:id, :tenant_id, :entity_type, :days, :action, true, :now, :now)
                """
            ),
            {"id": uuid.uuid4(), "tenant_id": tenant_id, "entity_type": entity_type, "days": days, "action": action, "now": now},
        )
    activities = [
        ("Cadastro de trabalhador", ["nome", "cpf", "contato", "perfil profissional"], ["trabalhadores"], "Cadastro e intermediação pública de emprego."),
        ("Upload e análise de currículo", ["curriculo", "experiencias", "formacao"], ["trabalhadores"], "Organizar informações profissionais para triagem do SINE."),
        ("Candidatura a vaga", ["identificacao", "vaga", "curriculo"], ["trabalhadores"], "Registrar interesse do trabalhador em vaga publicada."),
        ("Triagem pelo SINE", ["curriculo", "compatibilidade", "observacoes"], ["trabalhadores"], "Apoiar análise humana de aderência à vaga."),
        ("Encaminhamento para empresa", ["nome", "contato", "curriculo"], ["trabalhadores"], "Compartilhar candidato oficialmente com empresa solicitante."),
        ("Retorno da empresa", ["feedback", "status seletivo"], ["trabalhadores", "empresas"], "Controlar desfecho do encaminhamento."),
        ("Cadastro de empresa", ["cnpj", "contato", "responsaveis"], ["empresas"], "Habilitar empresas atendidas pelo SINE."),
        ("Comunicação SINE empresa", ["mensagens", "vaga", "encaminhamento"], ["empresas", "trabalhadores"], "Manter histórico operacional da intermediação."),
        ("Relatórios gerenciais", ["indicadores agregados"], ["trabalhadores", "empresas"], "Gerar indicadores para gestão pública."),
        ("Auditoria e segurança", ["logs", "acessos", "eventos"], ["usuarios"], "Proteger o sistema e rastrear acessos sensíveis."),
    ]
    for name, categories, subjects, purpose in activities:
        bind.execute(
            sa.text(
                """
                insert into lgpd_processing_activities
                (id, tenant_id, name, description, data_categories, data_subjects, purpose, legal_basis, retention_info, sharing_info, security_measures, responsible_area, is_active, created_at, updated_at)
                values (:id, :tenant_id, :name, :description, cast(:categories as json), cast(:subjects as json), :purpose, 'execucao_politica_publica', 'Conforme politica de retencao vigente e revisao manual.', :sharing, 'RBAC, logs de auditoria, segregacao por tenant e HTTPS.', 'SINE Jacarezinho', true, :now, :now)
                """
            ),
            {
                "id": uuid.uuid4(),
                "tenant_id": tenant_id,
                "name": name,
                "description": purpose,
                "categories": json.dumps(categories),
                "subjects": json.dumps(subjects),
                "purpose": purpose,
                "sharing": "Somente quando necessario para a vaga ou obrigacao operacional.",
                "now": now,
            },
        )


def downgrade() -> None:
    op.drop_index("ix_lgpd_processing_activities_is_active", table_name="lgpd_processing_activities")
    op.drop_index("ix_lgpd_processing_activities_tenant_id", table_name="lgpd_processing_activities")
    op.drop_table("lgpd_processing_activities")
    for column in ["tenant_id", "severity", "status", "reported_by_user_id", "closed_by_user_id"]:
        op.drop_index(f"ix_lgpd_incidents_{column}", table_name="lgpd_incidents")
    op.drop_table("lgpd_incidents")
    for column in ["tenant_id", "entity_type", "entity_id", "policy_id", "status", "reviewed_by_user_id"]:
        op.drop_index(f"ix_lgpd_retention_reviews_{column}", table_name="lgpd_retention_reviews")
    op.drop_table("lgpd_retention_reviews")
    for column in ["tenant_id", "entity_type", "is_active", "created_by_user_id"]:
        op.drop_index(f"ix_lgpd_retention_policies_{column}", table_name="lgpd_retention_policies")
    op.drop_table("lgpd_retention_policies")
    for column in ["tenant_id", "worker_id", "company_id", "job_id", "referral_id", "shared_by_user_id", "shared_with_company_user_id"]:
        op.drop_index(f"ix_lgpd_data_sharing_records_{column}", table_name="lgpd_data_sharing_records")
    op.drop_table("lgpd_data_sharing_records")
    for column in ["tenant_id", "worker_id", "company_id", "user_id", "term_version_id", "consent_type", "consent_status"]:
        op.drop_index(f"ix_lgpd_consent_history_{column}", table_name="lgpd_consent_history")
    op.drop_table("lgpd_consent_history")
    for column in ["tenant_id", "request_id", "actor_user_id", "event_type"]:
        op.drop_index(f"ix_lgpd_request_events_{column}", table_name="lgpd_request_events")
    op.drop_table("lgpd_request_events")
    for column in ["tenant_id", "requester_type", "worker_id", "company_id", "requester_user_id", "request_type", "status", "assigned_to_user_id", "resolved_by_user_id"]:
        op.drop_index(f"ix_lgpd_data_subject_requests_{column}", table_name="lgpd_data_subject_requests")
    op.drop_table("lgpd_data_subject_requests")
    op.drop_index("ix_lgpd_terms_versions_is_active", table_name="lgpd_terms_versions")
    op.drop_index("ix_lgpd_terms_versions_term_type", table_name="lgpd_terms_versions")
    op.drop_index("ix_lgpd_terms_versions_tenant_id", table_name="lgpd_terms_versions")
    op.drop_table("lgpd_terms_versions")
    op.drop_column("workers", "processing_blocked_at")
    op.drop_column("workers", "processing_blocked")
    op.drop_column("workers", "anonymized_at")
    op.drop_column("workers", "is_anonymized")
