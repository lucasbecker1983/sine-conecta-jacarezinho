import { FormEvent, useState } from "react";
import { AppButton, AppCard, AppInput, AppSelect } from "../ui";
import type { CompanyDetail } from "../../types";
import { friendlyStatus } from "../../utils/statusLabels";

const statuses = ["ativa", "em_atencao", "bloqueada", "suspensa", "inativa", "rejeitada"];

export function CompanyStatusActions({
  company,
  onSubmit,
}: {
  company: CompanyDetail;
  onSubmit: (status: string, reason: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(company.status || "ativa");
  const [reason, setReason] = useState(company.blocking_reason || "");
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(status, reason);
  }
  return (
    <AppCard>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
        <AppSelect label="Alterar status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {statuses.map((item) => <option key={item} value={item}>{friendlyStatus(item)}</option>)}
        </AppSelect>
        <AppInput label="Motivo ou orientação" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explique o motivo quando houver bloqueio ou restrição" />
        <AppButton type="submit" className="self-end">Alterar status</AppButton>
      </form>
    </AppCard>
  );
}
