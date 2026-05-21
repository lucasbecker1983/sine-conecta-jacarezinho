import { AppEmptyState } from "../ui";
import type { CompanyAuditSummary } from "../../types";

function auditLabel(action: string) {
  const labels: Record<string, string> = {
    company_viewed_by_sine: "Empresa visualizada pelo SINE",
    company_updated_by_sine: "Dados atualizados pelo SINE",
    company_status_changed: "Status alterado",
    company_blocked: "Empresa bloqueada",
    company_unblocked: "Empresa desbloqueada",
    company_note_created: "Observação interna adicionada",
    company_approved: "Empresa aprovada",
    company_rejected: "Empresa rejeitada",
    "company.create": "Empresa cadastrada",
    "company_portal.profile.save": "Cadastro atualizado pela empresa",
  };
  return labels[action] ?? action.replace(/_/g, " ");
}

export function CompanyAuditTimeline({ audit }: { audit: CompanyAuditSummary[] }) {
  if (!audit.length) return <AppEmptyState title="Sem auditoria registrada." />;
  return (
    <div className="space-y-3">
      {audit.map((item) => (
        <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
          <div className="font-semibold text-slate-950">{auditLabel(item.action)}</div>
          <div className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString("pt-BR")}</div>
          {item.details ? <pre className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(item.details, null, 2)}</pre> : null}
        </div>
      ))}
    </div>
  );
}
