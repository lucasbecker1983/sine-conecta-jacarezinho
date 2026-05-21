import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MessageSquareWarning } from "lucide-react";
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppCard,
  AppErrorState,
  AppLoadingState,
  AppPageHeader,
  AppTabs,
} from "../../components/ui";
import { CompanyAddressCard } from "../../components/companies/CompanyAddressCard";
import { CompanyAuditTimeline } from "../../components/companies/CompanyAuditTimeline";
import { CompanyFeedbacksTable } from "../../components/companies/CompanyFeedbacksTable";
import { CompanyInfoCard } from "../../components/companies/CompanyInfoCard";
import { CompanyInternalNotes } from "../../components/companies/CompanyInternalNotes";
import { CompanyJobsTable } from "../../components/companies/CompanyJobsTable";
import { CompanyReferralsTable } from "../../components/companies/CompanyReferralsTable";
import { CompanyResponsibleCard } from "../../components/companies/CompanyResponsibleCard";
import { CompanyStatusActions } from "../../components/companies/CompanyStatusActions";
import { CompanyStatusBadge } from "../../components/companies/CompanyStatusBadge";
import { CompanySummaryCards } from "../../components/companies/CompanySummaryCards";
import { api } from "../../services/api";
import type { CompanyDetail } from "../../types";

const tabs = [
  "Dados cadastrais",
  "Responsável e contatos",
  "Endereço",
  "Vagas",
  "Encaminhamentos",
  "Feedbacks",
  "Pendências e bloqueios",
  "Observações internas",
  "Auditoria",
];

export function CompanyDetailPage() {
  const { id } = useParams();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    if (!id) return;
    setLoading(true);
    api
      .get<CompanyDetail>(`/companies/${id}`)
      .then(({ data }) => {
        setCompany(data);
        setError("");
      })
      .catch((err) => setError(err.response?.data?.detail ?? "Não foi possível carregar a empresa."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(status: string, reason: string) {
    if (!id) return;
    const { data } = await api.patch<CompanyDetail>(`/companies/${id}/status`, { status, reason });
    setCompany(data);
    setMessage("Status administrativo da empresa atualizado.");
  }

  async function addNote(note: string) {
    if (!id) return;
    const { data } = await api.post<CompanyDetail>(`/companies/${id}/notes`, { note });
    setCompany(data);
    setMessage("Observação interna registrada para o SINE.");
  }

  if (loading) return <AppLoadingState message="Carregando dados completos da empresa..." />;
  if (error) return <AppErrorState message={error} />;
  if (!company) return <AppErrorState message="Empresa não encontrada." />;

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Histórico operacional da empresa"
        title={company.trade_name || company.legal_name}
        description={`${company.legal_name} · ${company.cnpj}`}
        action={
          <Link to="/empresas">
            <AppButton variant="secondary" icon={<ArrowLeft size={17} />}>Voltar para empresas</AppButton>
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <CompanyStatusBadge status={company.status} />
          {company.blocked_at || company.summary.pending_feedbacks > 0 ? <AppBadge tone="warning">Feedbacks pendentes</AppBadge> : <AppBadge tone="success">Regularidade da empresa</AppBadge>}
          <AppBadge tone="info">Dados visíveis apenas para o SINE</AppBadge>
        </div>
      </AppPageHeader>

      {message && <AppAlert tone="success">{message}</AppAlert>}
      {company.summary.blocking_reason && (
        <AppAlert tone="warning" title="Pendências e bloqueios">
          {company.summary.blocking_reason}
        </AppAlert>
      )}

      <CompanySummaryCards summary={company.summary} />
      <CompanyStatusActions company={company} onSubmit={updateStatus} />

      <AppCard>
        <AppTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </AppCard>

      {activeTab === "Dados cadastrais" && <CompanyInfoCard company={company} />}
      {activeTab === "Responsável e contatos" && <CompanyResponsibleCard company={company} />}
      {activeTab === "Endereço" && <CompanyAddressCard company={company} />}
      {activeTab === "Vagas" && <CompanyJobsTable jobs={company.jobs} />}
      {activeTab === "Encaminhamentos" && <CompanyReferralsTable referrals={company.referrals} />}
      {activeTab === "Feedbacks" && <CompanyFeedbacksTable feedbacks={company.feedbacks} />}
      {activeTab === "Pendências e bloqueios" && (
        <AppCard>
          <div className="flex items-start gap-3">
            <MessageSquareWarning className="mt-1 text-amber-700" size={20} />
            <div>
              <h2 className="font-bold text-slate-950">Regularidade da empresa</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{company.summary.regularity_status}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{company.summary.blocking_reason || "Nenhum bloqueio administrativo registrado."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/encaminhamentos"><AppButton variant="secondary" icon={<Building2 size={16} />}>Ver encaminhamentos pendentes</AppButton></Link>
                <Link to="/comunicacao"><AppButton variant="secondary">Solicitar retorno da empresa</AppButton></Link>
              </div>
            </div>
          </div>
        </AppCard>
      )}
      {activeTab === "Observações internas" && <CompanyInternalNotes notes={company.internal_notes} onSubmit={addNote} />}
      {activeTab === "Auditoria" && <CompanyAuditTimeline audit={company.audit} />}
    </div>
  );
}
