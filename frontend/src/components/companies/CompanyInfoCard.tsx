import { AppCard } from "../ui";
import type { CompanyDetail } from "../../types";
import { friendlyStatus } from "../../utils/statusLabels";

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-800">{value === true ? "Sim" : value === false ? "Não" : value || "Não informado"}</div>
    </div>
  );
}

export function CompanyInfoCard({ company }: { company: CompanyDetail }) {
  return (
    <AppCard>
      <h2 className="font-bold text-slate-950">Dados cadastrais</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Row label="Razão social" value={company.legal_name} />
        <Row label="Nome fantasia" value={company.trade_name} />
        <Row label="CNPJ" value={company.cnpj} />
        <Row label="Inscrição estadual" value={company.state_registration} />
        <Row label="Inscrição federal" value={company.federal_registration} />
        <Row label="Setor de atividade" value={company.segment} />
        <Row label="Porte da empresa" value={company.company_size} />
        <Row label="CNAE" value={company.cnae} />
        <Row label="Status" value={friendlyStatus(company.status)} />
        <Row label="Perfil completo" value={company.profile_complete} />
        <Row label="LGPD aceita" value={company.lgpd_accepted} />
        <Row label="Data de cadastro" value={new Date(company.created_at).toLocaleDateString("pt-BR")} />
        <Row label="Data de aprovação" value={company.approved_at ? new Date(company.approved_at).toLocaleDateString("pt-BR") : null} />
      </div>
    </AppCard>
  );
}
