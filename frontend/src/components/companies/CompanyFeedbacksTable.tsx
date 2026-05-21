import { AppBadge, AppTable } from "../ui";
import type { CompanyFeedbackSummary } from "../../types";
import { friendlyStatus, statusTone } from "../../utils/statusLabels";

type Row = CompanyFeedbackSummary & { id: string };

export function CompanyFeedbacksTable({ feedbacks }: { feedbacks: CompanyFeedbackSummary[] }) {
  const rows: Row[] = feedbacks.map((item) => ({ ...item, id: item.id || item.referral_id }));
  return (
    <AppTable
      rows={rows}
      empty="Nenhum feedback registrado ou pendente."
      columns={[
        { key: "job", header: "Vaga", render: (item) => item.job_title },
        { key: "worker", header: "Candidato", render: (item) => item.worker_name },
        { key: "status", header: "Retorno", render: (item) => <AppBadge tone={statusTone(item.status)}>{friendlyStatus(item.status)}</AppBadge> },
        { key: "pending", header: "Bloqueia novas vagas", render: (item) => item.pending ? <AppBadge tone="warning">Feedback pendente</AppBadge> : <AppBadge tone="success">Resolvido</AppBadge> },
        { key: "comments", header: "Comentário", render: (item) => item.comments || "Sem comentário" },
      ]}
    />
  );
}
