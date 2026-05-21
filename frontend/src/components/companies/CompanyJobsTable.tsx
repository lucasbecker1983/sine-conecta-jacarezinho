import { Link } from "react-router-dom";
import { AppBadge, AppTable } from "../ui";
import type { CompanyJobSummary } from "../../types";
import { friendlyStatus, statusTone } from "../../utils/statusLabels";

export function CompanyJobsTable({ jobs }: { jobs: CompanyJobSummary[] }) {
  return (
    <AppTable
      rows={jobs}
      empty="Nenhuma vaga vinculada a esta empresa."
      columns={[
        { key: "title", header: "Cargo", render: (job) => <span className="font-semibold text-slate-950">{job.title}</span> },
        { key: "status", header: "Status", render: (job) => <AppBadge tone={statusTone(job.status)}>{friendlyStatus(job.status)}</AppBadge> },
        { key: "visibility", header: "Visibilidade", render: (job) => job.is_confidential ? <AppBadge tone="warning">Confidencial para candidatos</AppBadge> : <AppBadge tone="success">Pública para candidatos</AppBadge> },
        { key: "vacancies", header: "Vagas", render: (job) => job.vacancies },
        { key: "pending", header: "Feedbacks pendentes", render: (job) => job.pending_feedbacks },
        { key: "created", header: "Criada em", render: (job) => new Date(job.created_at).toLocaleDateString("pt-BR") },
        { key: "action", header: "Ação", render: (job) => <Link className="font-semibold text-emerald-800 hover:underline" to={`/sine/triagem/${job.id}`}>Abrir vaga</Link> },
      ]}
    />
  );
}
