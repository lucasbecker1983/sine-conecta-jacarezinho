import { AppCard } from "../ui";
import type { CompanyDetail } from "../../types";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-800">{value || "Não informado"}</div>
    </div>
  );
}

export function CompanyResponsibleCard({ company }: { company: CompanyDetail }) {
  return (
    <AppCard>
      <h2 className="font-bold text-slate-950">Responsável e contatos</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Row label="Responsável" value={company.responsible_name || company.hr_responsible_name} />
        <Row label="Cargo" value={company.responsible_position} />
        <Row label="E-mail do responsável" value={company.responsible_email || company.email} />
        <Row label="Telefone do responsável" value={company.responsible_phone || company.phone} />
        <Row label="WhatsApp" value={company.whatsapp} />
        <Row label="Site" value={company.site} />
      </div>
    </AppCard>
  );
}
