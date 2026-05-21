import { useEffect, useMemo, useState } from "react";
import { PermissionDenied } from "../components/common/PermissionDenied";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { DataSharingTable } from "../components/lgpd/DataSharingTable";
import type { DataSharingRecord } from "../components/lgpd/DataSharingTable";
import { IncidentSeverityBadge } from "../components/lgpd/IncidentSeverityBadge";
import { LgpdStatusBadge } from "../components/lgpd/LgpdStatusBadge";
import { RetentionPolicyCard } from "../components/lgpd/RetentionPolicyCard";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";

const tabs = [
  "Visão geral",
  "Solicitações dos titulares",
  "Consentimentos",
  "Compartilhamentos",
  "Retenção de dados",
  "Incidentes",
  "Atividades de tratamento",
  "Termos e versões",
  "Auditoria LGPD",
];

type LgpdRequest = {
  id: string;
  requester_name: string;
  request_type: string;
  status: string;
  description: string;
};

type RetentionPolicy = {
  id: string;
  entity_type: string;
  retention_days: number;
  action_after_retention: string;
  is_active: boolean;
};

type Incident = {
  id: string;
  title: string;
  description: string;
  severity: string;
};

type ProcessingActivity = {
  id: string;
  name: string;
  purpose: string;
};

type Term = {
  id: string;
  title: string;
  term_type: string;
  version: string;
  summary?: string | null;
};

export function LgpdAdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [requests, setRequests] = useState<LgpdRequest[]>([]);
  const [sharing, setSharing] = useState<DataSharingRecord[]>([]);
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const allowed = useMemo(
    () => user?.roles?.some((role) => ["super_admin", "tenant_admin", "sine_manager", "sine_staff"].includes(role)),
    [user?.roles],
  );

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get("/lgpd/dashboard"),
      api.get("/lgpd/requests"),
      api.get("/lgpd/retention/policies"),
      api.get("/lgpd/incidents").catch(() => ({ data: [] })),
      api.get("/lgpd/processing-activities"),
      api.get("/lgpd/terms"),
      api.get("/lgpd/data-sharing").catch(() => ({ data: [] })),
    ])
      .then(([dashboardResponse, requestsResponse, policiesResponse, incidentsResponse, activitiesResponse, termsResponse, sharingResponse]) => {
        setDashboard(dashboardResponse.data);
        setRequests(requestsResponse.data);
        setPolicies(policiesResponse.data);
        setIncidents(incidentsResponse.data);
        setActivities(activitiesResponse.data);
        setTerms(termsResponse.data);
        setSharing(sharingResponse.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [allowed]);

  if (!allowed) return <PermissionDenied />;
  if (loading) return <LoadingState message="Carregando painel LGPD..." />;
  if (error) return <ErrorState message="Não foi possível carregar o painel LGPD." />;

  const cards = [
    ["solicitações abertas", dashboard.open_requests ?? 0],
    ["vencendo", dashboard.due_soon_requests ?? 0],
    ["concluídas no mês", dashboard.completed_month ?? 0],
    ["consentimentos ativos", dashboard.active_consents ?? 0],
    ["revogados", dashboard.revoked_consents ?? 0],
    ["compartilhamentos", dashboard.data_sharing_records ?? 0],
    ["incidentes abertos", dashboard.open_incidents ?? 0],
    ["retenção pendente", dashboard.pending_retention_reviews ?? 0],
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-emerald-700">Governança LGPD</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Painel do Gestor</h1>
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${activeTab === tab ? "bg-emerald-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Visão geral" ? (
        <section className="grid gap-3 md:grid-cols-4">
          {cards.map(([label, value]) => (
            <article key={label} className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === "Solicitações dos titulares" ? (
        <section className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-950">{request.requester_name}</h2>
                  <p className="text-sm text-slate-600">{request.request_type}</p>
                </div>
                <LgpdStatusBadge status={request.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{request.description}</p>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === "Compartilhamentos" ? <DataSharingTable records={sharing} /> : null}
      {activeTab === "Retenção de dados" ? <section className="grid gap-3 md:grid-cols-2">{policies.map((policy) => <RetentionPolicyCard key={policy.id} policy={policy} />)}</section> : null}
      {activeTab === "Incidentes" ? (
        <section className="space-y-3">
          {incidents.map((incident) => (
            <article key={incident.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-950">{incident.title}</h2>
                <IncidentSeverityBadge severity={incident.severity} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{incident.description}</p>
            </article>
          ))}
        </section>
      ) : null}
      {activeTab === "Atividades de tratamento" ? <section className="grid gap-3 md:grid-cols-2">{activities.map((activity) => <article key={activity.id} className="rounded-md border border-slate-200 bg-white p-4"><h2 className="font-semibold text-slate-950">{activity.name}</h2><p className="mt-2 text-sm text-slate-600">{activity.purpose}</p></article>)}</section> : null}
      {activeTab === "Termos e versões" ? <section className="grid gap-3 md:grid-cols-2">{terms.map((term) => <article key={term.id} className="rounded-md border border-slate-200 bg-white p-4"><h2 className="font-semibold text-slate-950">{term.title}</h2><p className="mt-1 text-sm text-slate-500">{term.term_type} v{term.version}</p><p className="mt-2 text-sm text-slate-600">{term.summary}</p></article>)}</section> : null}
      {activeTab === "Consentimentos" ? <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">Consentimentos versionados aparecem nos perfis de candidato e empresa; os agregados estão na visão geral.</p> : null}
      {activeTab === "Auditoria LGPD" ? <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">Alterações, exportações, correções, anonimizações e incidentes registram audit_log no backend.</p> : null}
    </div>
  );
}
