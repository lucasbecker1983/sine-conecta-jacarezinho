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

export function CompanyAddressCard({ company }: { company: CompanyDetail }) {
  return (
    <AppCard>
      <h2 className="font-bold text-slate-950">Endereço</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Row label="CEP" value={company.cep} />
        <Row label="Logradouro" value={company.address} />
        <Row label="Número" value={company.address_number} />
        <Row label="Complemento" value={company.address_complement} />
        <Row label="Bairro" value={company.district} />
        <Row label="Cidade/UF" value={`${company.city || "Não informado"} / ${company.state || "--"}`} />
      </div>
    </AppCard>
  );
}
