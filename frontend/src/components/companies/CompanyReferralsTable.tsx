import { AppBadge, AppTable } from "../ui";
import type { CompanyReferralSummary } from "../../types";
import { friendlyStatus, statusTone } from "../../utils/statusLabels";

export function CompanyReferralsTable({ referrals }: { referrals: CompanyReferralSummary[] }) {
  return (
    <AppTable
      rows={referrals}
      empty="Nenhum encaminhamento vinculado a esta empresa."
      columns={[
        { key: "job", header: "Vaga", render: (item) => item.job_title },
        { key: "worker", header: "Candidato", render: (item) => <span className="font-semibold text-slate-950">{item.worker_name}</span> },
        { key: "created", header: "Encaminhado em", render: (item) => new Date(item.created_at).toLocaleDateString("pt-BR") },
        { key: "status", header: "Status", render: (item) => <AppBadge tone={statusTone(item.status)}>{friendlyStatus(item.status)}</AppBadge> },
        { key: "feedback", header: "Retorno", render: (item) => friendlyStatus(item.feedback_status || item.status) },
      ]}
    />
  );
}
