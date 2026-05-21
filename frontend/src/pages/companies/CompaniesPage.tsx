import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Eye, KeyRound, Plus, ShieldCheck } from "lucide-react";
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppCard,
  AppEmptyState,
  AppInput,
  AppMetricCard,
  AppPageHeader,
  AppSelect,
  AppTable,
} from "../../components/ui";
import { CompanyStatusBadge } from "../../components/companies/CompanyStatusBadge";
import { api } from "../../services/api";
import type { Company, CompanyListItem } from "../../types";

const regionalCities = ["Jacarezinho", "Cambará", "Andirá", "Bandeirantes", "Santo Antônio da Platina", "Ribeirão Claro", "Carlópolis", "Siqueira Campos", "Joaquim Távora", "Ibaiti", "Wenceslau Braz", "Tomazina", "Pinhalão", "Quatiguá", "Salto do Itararé", "Barra do Jacaré"];

const emptyCompany = {
  cnpj: "",
  legal_name: "",
  trade_name: "",
  city: "Jacarezinho",
  state: "PR",
  cep: "",
  email: "",
  phone: "",
  whatsapp: "",
  responsible_name: "",
  hr_responsible_name: "",
  segment: "",
  lgpd_accepted: true,
};

type PortalUserResult = {
  email: string;
  full_name: string;
  temporary_password?: string | null;
  created: boolean;
};

function maskCnpj(cnpj: string) {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length < 14) return cnpj;
  return `${digits.slice(0, 2)}.***.***/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [form, setForm] = useState(emptyCompany);
  const [userCompanyId, setUserCompanyId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [lastCredential, setLastCredential] = useState<PortalUserResult | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [blocked, setBlocked] = useState("");

  function refresh() {
    api
      .get<CompanyListItem[]>("/companies", {
        params: {
          search: search || undefined,
          status: status || undefined,
          city: city || undefined,
          blocked: blocked === "" ? undefined : blocked === "sim",
        },
      })
      .then(({ data }) => {
        setCompanies(data);
        if (!userCompanyId && data[0]) setUserCompanyId(data[0].id);
      })
      .catch(() => setCompanies([]));
  }

  useEffect(() => {
    refresh();
  }, []);

  const metrics = useMemo(() => ({
    total: companies.length,
    active: companies.filter((company) => company.status === "ativa").length,
    attention: companies.filter((company) => company.pending_feedbacks > 0 || company.status === "em_atencao").length,
    blocked: companies.filter((company) => company.blocked).length,
  }), [companies]);

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const { data } = await api.post<Company>("/companies", form);
      setForm(emptyCompany);
      setUserCompanyId(data.id);
      setUserEmail(data.email ?? "");
      setUserName(data.hr_responsible_name ?? data.responsible_name ?? "");
      setMessage("Empresa cadastrada. Ela já está disponível para gestão operacional do SINE.");
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Não foi possível cadastrar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  async function createPortalUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLastCredential(null);
    try {
      const { data } = await api.post<PortalUserResult>(`/companies/${userCompanyId}/portal-user`, {
        email: userEmail,
        full_name: userName,
        position: "Responsável pelo RH",
      });
      setLastCredential(data);
      setMessage(data.created ? "Usuário da empresa criado. Repasse a senha temporária com segurança." : "Usuário existente vinculado à empresa.");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Não foi possível gerar o usuário da empresa.");
    }
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Administração SINE"
        title="Empresas"
        description="Gestão completa das empresas cadastradas, com dados cadastrais, pendências, bloqueios, vagas, retornos e auditoria."
      />
      {(message || error) && <AppAlert tone={error ? "error" : "success"}>{error || message}</AppAlert>}

      <div className="grid gap-3 md:grid-cols-4">
        <AppMetricCard label="Empresas cadastradas" value={metrics.total} />
        <AppMetricCard label="Empresas ativas" value={metrics.active} />
        <AppMetricCard label="Com feedback pendente" value={metrics.attention} />
        <AppMetricCard label="Bloqueadas ou em atenção" value={metrics.blocked} />
      </div>

      <AppCard>
        <form onSubmit={(event) => { event.preventDefault(); refresh(); }} className="grid gap-3 lg:grid-cols-[1fr_190px_180px_180px_auto]">
          <AppInput label="Buscar empresa" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Razão social, fantasia, CNPJ, cidade ou responsável" />
          <AppSelect label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="ativa">Empresa ativa</option>
            <option value="em_atencao">Empresa em atenção</option>
            <option value="bloqueada">Abertura suspensa</option>
            <option value="suspensa">Suspensa</option>
            <option value="inativa">Inativa</option>
            <option value="rejeitada">Rejeitada</option>
          </AppSelect>
          <AppInput label="Cidade" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Jacarezinho" />
          <AppSelect label="Pendência" value={blocked} onChange={(event) => setBlocked(event.target.value)}>
            <option value="">Todas</option>
            <option value="sim">Com pendências</option>
            <option value="nao">Sem pendências</option>
          </AppSelect>
          <AppButton type="submit" className="self-end">Filtrar</AppButton>
        </form>
      </AppCard>

      <AppTable
        rows={companies}
        empty={<AppEmptyState title="Nenhuma empresa encontrada." message="Ajuste os filtros ou cadastre uma nova empresa pelo SINE." />}
        columns={[
          { key: "company", header: "Empresa", render: (company) => <div><div className="font-semibold text-slate-950">{company.trade_name || company.legal_name}</div><div className="text-xs text-slate-500">{company.legal_name}</div></div> },
          { key: "cnpj", header: "CNPJ", render: (company) => maskCnpj(company.cnpj) },
          { key: "city", header: "Cidade/UF", render: (company) => `${company.city || "Não informada"} / ${company.state || "--"}` },
          { key: "responsible", header: "Responsável", render: (company) => company.responsible_name || company.hr_responsible_name || "Não informado" },
          { key: "status", header: "Status", render: (company) => <CompanyStatusBadge status={company.status} /> },
          { key: "jobs", header: "Vagas abertas", render: (company) => company.open_jobs },
          { key: "feedbacks", header: "Feedbacks pendentes", render: (company) => company.pending_feedbacks ? <AppBadge tone="warning">{company.pending_feedbacks}</AppBadge> : <AppBadge tone="success">0</AppBadge> },
          { key: "activity", header: "Última atividade", render: (company) => company.last_activity_at ? new Date(company.last_activity_at).toLocaleDateString("pt-BR") : "Sem atividade" },
          { key: "action", header: "Ações", render: (company) => <Link to={`/empresas/${company.id}`}><AppButton variant="secondary" icon={<Eye size={16} />}>Ver detalhes</AppButton></Link> },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={createCompany} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Building2 className="text-emerald-700" size={22} />
            <div>
              <h2 className="text-lg font-bold text-slate-950">Cadastrar empresa pelo SINE</h2>
              <p className="text-sm text-slate-600">O cadastro fica disponível para acompanhamento, auditoria e geração de acesso ao portal.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <AppInput required label="Razão social" value={form.legal_name} onChange={(event) => setForm({ ...form, legal_name: event.target.value })} />
            <AppInput label="Nome fantasia" value={form.trade_name} onChange={(event) => setForm({ ...form, trade_name: event.target.value })} />
            <AppInput required label="CNPJ" value={form.cnpj} onChange={(event) => setForm({ ...form, cnpj: event.target.value })} />
            <AppSelect label="Cidade" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>{regionalCities.map((item) => <option key={item}>{item}</option>)}</AppSelect>
            <AppInput label="E-mail" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <AppInput label="Telefone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <AppInput label="WhatsApp" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
            <AppInput required label="Responsável pelo RH" value={form.hr_responsible_name} onChange={(event) => setForm({ ...form, hr_responsible_name: event.target.value, responsible_name: event.target.value })} />
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-950">
            <input required type="checkbox" checked={form.lgpd_accepted} onChange={(event) => setForm({ ...form, lgpd_accepted: event.target.checked })} className="mt-1" />
            <span><ShieldCheck size={16} className="mr-1 inline" /> Consentimento LGPD registrado para tratamento dos dados da empresa e do responsável.</span>
          </label>
          <AppButton type="submit" disabled={saving} className="mt-4" icon={<Plus size={17} />}>{saving ? "Cadastrando..." : "Cadastrar empresa"}</AppButton>
        </form>

        <form onSubmit={createPortalUser} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <KeyRound className="text-emerald-700" size={22} />
            <div>
              <h2 className="text-lg font-bold text-slate-950">Gerar usuário da empresa</h2>
              <p className="text-sm text-slate-600">A empresa poderá postar vagas, receber encaminhamentos e retornar feedback.</p>
            </div>
          </div>
          <div className="space-y-3">
            <AppSelect required label="Empresa" value={userCompanyId} onChange={(event) => setUserCompanyId(event.target.value)}>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.trade_name || company.legal_name}</option>)}
            </AppSelect>
            <AppInput required label="Nome do usuário" value={userName} onChange={(event) => setUserName(event.target.value)} />
            <AppInput required label="E-mail de login" type="email" value={userEmail} onChange={(event) => setUserEmail(event.target.value)} />
          </div>
          <AppButton type="submit" className="mt-4" icon={<KeyRound size={17} />}>Gerar acesso</AppButton>
          {lastCredential && (
            <AppAlert tone="warning" className="mt-4">
              <strong>{lastCredential.email}</strong>
              <br />
              {lastCredential.temporary_password ? `Senha temporária: ${lastCredential.temporary_password}` : "Usuário vinculado. A senha existente foi preservada."}
            </AppAlert>
          )}
        </form>
      </div>
    </div>
  );
}
