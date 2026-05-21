import { AppMetricCard } from "../ui";
import type { CompanySummary } from "../../types";

export function CompanySummaryCards({ summary }: { summary: CompanySummary }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
      <AppMetricCard label="Vagas abertas" value={summary.open_jobs} />
      <AppMetricCard label="Vagas encerradas" value={summary.closed_jobs} />
      <AppMetricCard label="Encaminhamentos" value={summary.referrals_received} />
      <AppMetricCard label="Feedbacks pendentes" value={summary.pending_feedbacks} />
      <AppMetricCard label="Contratações" value={summary.hires_reported} />
      <AppMetricCard label="Dias desde retorno" value={summary.days_since_last_return ?? "-"} />
      <AppMetricCard label="Regularidade" value={summary.regularity_status} />
    </div>
  );
}
