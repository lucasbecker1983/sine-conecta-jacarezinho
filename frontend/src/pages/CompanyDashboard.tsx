import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  MessageSquareReply,
  Send,
  ShieldCheck,
  UserRoundSearch,
} from "lucide-react";
import { api } from "../services/api";
import type { Company, Job } from "../types";
import sineLogoFullHd from "../assets/logos/sine-logo-fullhd.png";
import { OnboardingChecklist } from "../components/onboarding/OnboardingChecklist";
import { friendlyStatus, StatusBadge } from "../utils/statusLabels";
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppInput,
  AppLoadingState,
  AppMetricCard,
  AppPageHeader,
  AppSelect,
  AppStatusTimeline,
  AppTextarea,
} from "../components/ui";

const regionalCities = [
  "Jacarezinho",
  "Cambará",
  "Andirá",
  "Bandeirantes",
  "Santo Antônio da Platina",
  "Ribeirão Claro",
  "Carlópolis",
  "Siqueira Campos",
  "Joaquim Távora",
  "Ibaiti",
  "Wenceslau Braz",
  "Tomazina",
  "Pinhalão",
  "Quatiguá",
  "Salto do Itararé",
  "Barra do Jacaré",
];

type CompanyForm = {
  cnpj: string;
  legal_name: string;
  trade_name: string;
  state_registration: string;
  federal_registration: string;
  city: string;
  state: string;
  cep: string;
  email: string;
  phone: string;
  whatsapp: string;
  responsible_name: string;
  hr_responsible_name: string;
  segment: string;
  notes: string;
  lgpd_accepted: boolean;
};

type JobForm = {
  title: string;
  description: string;
  vacancies: number;
  start_date: string;
  closing_deadline: string;
  salary_range: string;
  benefits: string;
  workday: string;
  schedule: string;
  workplace: string;
  modality: string;
  minimum_education: string;
  required_experience: string;
  desired_courses: string;
  cnh_required: string;
  contract_type: string;
  notes: string;
  travel_required: boolean;
};

type PortalStatus = {
  profile_complete: boolean;
  pending_returns: number;
  pending_feedbacks?: Array<{
    referral_id: string;
    job_id: string;
    job_title: string;
    worker_name: string;
    status: string;
    created_at?: string | null;
  }>;
  can_open_job: boolean;
  blocking_reason?: string | null;
  ai_scope: string;
};

type CompanyReferral = {
  id: string;
  job_title: string;
  worker_name: string;
  worker_email?: string | null;
  worker_phone?: string | null;
  worker_whatsapp?: string | null;
  resume_filename?: string | null;
  status: string;
  match_score?: number | null;
  created_at: string;
};

const emptyCompany: CompanyForm = {
  cnpj: "",
  legal_name: "",
  trade_name: "",
  state_registration: "",
  federal_registration: "",
  city: "Jacarezinho",
  state: "PR",
  cep: "",
  email: "",
  phone: "",
  whatsapp: "",
  responsible_name: "",
  hr_responsible_name: "",
  segment: "",
  notes: "",
  lgpd_accepted: false,
};

const emptyJob: JobForm = {
  title: "",
  description: "",
  vacancies: 1,
  start_date: "",
  closing_deadline: "",
  salary_range: "",
  benefits: "",
  workday: "",
  schedule: "",
  workplace: "",
  modality: "presencial",
  minimum_education: "",
  required_experience: "",
  desired_courses: "",
  cnh_required: "",
  contract_type: "",
  notes: "",
  travel_required: false,
};

function asCompanyForm(company: Company | null): CompanyForm {
  if (!company) return emptyCompany;
  return {
    cnpj: company.cnpj ?? "",
    legal_name: company.legal_name ?? "",
    trade_name: company.trade_name ?? "",
    state_registration: company.state_registration ?? "",
    federal_registration: company.federal_registration ?? "",
    city: company.city ?? "Jacarezinho",
    state: company.state ?? "PR",
    cep: company.cep ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    whatsapp: company.whatsapp ?? "",
    responsible_name: company.responsible_name ?? "",
    hr_responsible_name: company.hr_responsible_name ?? "",
    segment: company.segment ?? "",
    notes: company.notes ?? "",
    lgpd_accepted: company.lgpd_accepted,
  };
}

function useCompanyPortal() {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [referrals, setReferrals] = useState<CompanyReferral[]>([]);
  const [status, setStatus] = useState<PortalStatus>({
    profile_complete: false,
    pending_returns: 0,
    can_open_job: false,
    ai_scope: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function refresh() {
    setLoading(true);
    Promise.all([
      api.get<Company | null>("/company-portal/profile"),
      api.get<Job[]>("/company-portal/jobs"),
      api.get<CompanyReferral[]>("/company-portal/referrals"),
      api.get<PortalStatus>("/company-portal/status"),
    ])
      .then(([profile, companyJobs, companyReferrals, portalStatus]) => {
        setCompany(profile.data);
        setJobs(companyJobs.data);
        setReferrals(companyReferrals.data);
        setStatus(portalStatus.data);
        setError("");
      })
      .catch(() =>
        setError("Não foi possível carregar a área da empresa agora."),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  return {
    company,
    jobs,
    referrals,
    status,
    loading,
    error,
    refresh,
    setError,
  };
}

function PortalAlert({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <AppAlert tone={error ? "error" : "success"}>{error || message}</AppAlert>;
}

export function CompanyDashboard() {
  const { company, jobs, referrals, status, loading, error } =
    useCompanyPortal();
  const latestJobs = useMemo(() => jobs.slice(0, 3), [jobs]);
  const latestReferrals = useMemo(() => referrals.slice(0, 3), [referrals]);
  const companySituation = !status.profile_complete
    ? {
        label: "Empresa em atenção",
        tone: "warning" as const,
        title: "Complete o cadastro para operar com o SINE",
        description:
          "Finalize os dados da empresa e aceite os termos para solicitar vagas.",
      }
    : status.can_open_job
      ? {
          label: "Empresa regular",
          tone: "success" as const,
          title: "A empresa pode abrir novas vagas",
          description:
            "O cadastro está disponível ao SINE e não há retornos obrigatórios pendentes.",
        }
      : {
          label: "Abertura de vagas temporariamente suspensa",
          tone: "warning" as const,
          title: "Responda os encaminhamentos pendentes",
          description:
            "Para manter o atendimento organizado, novas vagas ficam pausadas até a empresa registrar os retornos.",
        };

  if (loading) return <AppLoadingState message="Carregando área da empresa..." />;
  if (error) return <AppErrorState message={error} />;

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Portal da Empresa"
        title="Bem-vindo ao SINE Conecta Jacarezinho"
        description="Solicite vagas, acompanhe trabalhadores encaminhados e mantenha o retorno em dia para fortalecer a empregabilidade local."
        action={
          <img
            src={sineLogoFullHd}
            alt="Logotipo do SINE Jacarezinho"
            className="h-9 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[170px]"
            width={170}
            height={59}
          />
        }
      >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <ShieldCheck size={14} /> Portal da Empresa
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  <LockKeyhole size={14} /> LGPD e auditoria ativas
                </span>
              </div>
            </div>
            <p className="mt-2 max-w-3xl text-xs font-semibold uppercase tracking-wide text-emerald-800">
              A empresa vê apenas trabalhadores encaminhados oficialmente. A IA é
              ferramenta interna do SINE.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <AppCard className="bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Cadastro
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-950">
                  {status.profile_complete ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={18} className="text-amber-600" />
                  )}
                  {status.profile_complete ? "Disponível ao SINE" : "Pendente"}
                </div>
              </AppCard>
              <AppMetricCard label="Vagas solicitadas" value={jobs.length} />
              <AppMetricCard
                label="Retornos pendentes"
                value={status.pending_returns}
              />
            </div>
      </AppPageHeader>
      <OnboardingChecklist role="company_user" />

      <AppAlert tone={companySituation.tone} title={companySituation.title}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <AppBadge tone={companySituation.tone}>{companySituation.label}</AppBadge>
            <p className="mt-3 max-w-3xl">{companySituation.description}</p>
          </div>
          {!status.can_open_job && status.pending_returns > 0 ? (
            <Link
              to="/empresa/encaminhamentos"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
            >
              Responder encaminhamentos
            </Link>
          ) : null}
        </div>
      </AppAlert>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            to: "/empresa/cadastro",
            title: "Cadastro da empresa",
            body: "Dados legais, contatos, responsável pelo RH e aceite LGPD.",
            icon: FileCheck2,
          },
          {
            to: "/empresa/vagas",
            title: "Abrir vagas",
            body: status.can_open_job
              ? "Nova solicitação liberada."
              : "Informe os retornos pendentes para abrir uma nova solicitação.",
            icon: BriefcaseBusiness,
          },
          {
            to: "/empresa/encaminhamentos",
            title: "Encaminhamentos",
            body: "Veja trabalhadores enviados pelo SINE e registre o retorno.",
            icon: UserRoundSearch,
          },
          {
            to: "/empresa/privacidade",
            title: "Privacidade e dados",
            body: "Consulte termos, compartilhamentos recebidos e orientações LGPD.",
            icon: ShieldCheck,
          },
          {
            to: "/empresa/comunicacao",
            title: "Comunicação oficial com o SINE",
            body: "Mensagens vinculadas a vagas, encaminhamentos, currículos e feedbacks com trilha de auditoria.",
            icon: MessageSquareReply,
            wide: true,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${item.wide ? "md:col-span-2" : ""}`}
            >
              <AppCard interactive className="h-full">
                <Icon className="text-emerald-700" size={22} />
                <div className="mt-3 font-bold text-slate-950">
                  {item.title}
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.body}</p>
              </AppCard>
            </Link>
          );
        })}
      </div>

      {!status.can_open_job && status.pending_returns > 0 && (
        <AppAlert tone="warning" title="Precisamos do seu retorno para continuar o fluxo">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mt-1 text-sm text-amber-900">
                {status.blocking_reason ??
                  "Para mantermos o processo justo com os trabalhadores e eficiente para sua empresa, informe o resultado dos encaminhamentos antes de abrir uma nova solicitação."}
              </p>
            </div>
            <Link
              to="/empresa/encaminhamentos"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
            >
              Informar retorno agora
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            Para mantermos o processo justo com os trabalhadores e eficiente
            para sua empresa, informe o resultado dos encaminhamentos
            antes de abrir uma nova solicitação.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(status.pending_feedbacks ?? []).map((item) => (
              <div
                key={item.referral_id}
                className="rounded-md border border-amber-200 bg-white p-3 text-sm"
              >
                <div className="font-semibold text-slate-950">
                  {item.worker_name}
                </div>
                <div className="mt-1 text-slate-600">
                  {item.job_title} · {friendlyStatus(item.status)}
                </div>
              </div>
            ))}
          </div>
        </AppAlert>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <AppCard>
          <h2 className="text-lg font-bold text-slate-950">Vagas recentes</h2>
          <div className="mt-3 space-y-2">
            {loading && <p className="text-sm text-slate-500">Carregando...</p>}
            {!loading && latestJobs.length === 0 && (
              <p className="text-sm text-slate-500">
                Nenhuma vaga solicitada ainda.
              </p>
            )}
            {latestJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-md border border-slate-100 bg-slate-50 p-3"
              >
                <div className="font-semibold text-slate-950">{job.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {friendlyStatus(job.status)}
                </div>
              </div>
            ))}
          </div>
        </AppCard>
        <AppCard>
          <h2 className="text-lg font-bold text-slate-950">
            Últimos encaminhamentos
          </h2>
          <div className="mt-3 space-y-2">
            {loading && <p className="text-sm text-slate-500">Carregando...</p>}
            {!loading && latestReferrals.length === 0 && (
              <p className="text-sm text-slate-500">
                Ainda não há trabalhadores encaminhados.
              </p>
            )}
            {latestReferrals.map((referral) => (
              <div
                key={referral.id}
                className="rounded-md border border-slate-100 bg-slate-50 p-3"
              >
                <div className="font-semibold text-slate-950">
                  {referral.worker_name}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {referral.job_title} · {friendlyStatus(referral.status)}
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      </div>
    </div>
  );
}

export function CompanyProfilePage() {
  const { company, error, refresh, setError } = useCompanyPortal();
  const [form, setForm] = useState<CompanyForm>(emptyCompany);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(asCompanyForm(company));
  }, [company]);

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.put<Company>("/company-portal/profile", form);
      setMessage(
        "Cadastro da empresa salvo e disponibilizado para a equipe do SINE.",
      );
      refresh();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ??
          "Revise os dados obrigatórios da empresa.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        title="Cadastro da empresa"
        description="Dados oficiais, contatos, região atendida e consentimento LGPD."
      />
      <PortalAlert message={message} error={error} />
      <AppCard>
      <form onSubmit={saveCompany}>
        <div className="grid gap-3 md:grid-cols-2">
          <AppInput required label="Razão social" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
          <AppInput label="Nome fantasia" value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} />
          <AppInput required label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          <AppInput label="Inscrição estadual" value={form.state_registration} onChange={(e) => setForm({ ...form, state_registration: e.target.value })} />
          <AppInput label="Inscrição federal" value={form.federal_registration} onChange={(e) => setForm({ ...form, federal_registration: e.target.value })} />
          <AppInput label="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
          <AppSelect label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
            {regionalCities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </AppSelect>
          <AppInput label="Estado" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} maxLength={2} />
          <AppInput label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <AppInput label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <AppInput label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <AppInput required label="Responsável pelo RH" value={form.hr_responsible_name} onChange={(e) => setForm({ ...form, hr_responsible_name: e.target.value, responsible_name: e.target.value })} />
        </div>
        <AppTextarea label="Observações institucionais" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-3" />
        <label className="mt-4 flex items-start gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-950">
          <input
            required
            type="checkbox"
            checked={form.lgpd_accepted}
            onChange={(e) =>
              setForm({ ...form, lgpd_accepted: e.target.checked })
            }
            className="mt-1"
          />
          <span>
            Declaro ciência e aceite dos termos da LGPD para tratamento dos
            dados da empresa, contatos e histórico de vagas pelo SINE
            Jacarezinho.
          </span>
        </label>
        <AppButton
          type="submit"
          disabled={saving}
          className="mt-4"
          icon={<ShieldCheck size={17} />}
        >
          {saving ? "Salvando..." : "Salvar cadastro"}
        </AppButton>
      </form>
      </AppCard>
    </div>
  );
}

export function CompanyJobsPage() {
  const { jobs, status, error, refresh, setError } = useCompanyPortal();
  const [form, setForm] = useState<JobForm>(emptyJob);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const lockedReason = !status.profile_complete
    ? "Complete o cadastro e aceite os termos da LGPD para solicitar vagas."
    : status.pending_returns > 0
      ? (status.blocking_reason ??
        "Abertura de vagas temporariamente suspensa: registre os retornos pendentes antes de abrir uma nova vaga.")
      : "";

  async function createJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.post<Job>("/company-portal/jobs", {
        ...form,
        vacancies: Number(form.vacancies) || 1,
      });
      setForm(emptyJob);
      setMessage(
        "Vaga enviada ao SINE. A triagem com IA permanece sob responsabilidade dos colaboradores.",
      );
      refresh();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Não foi possível abrir a vaga agora.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Portal da Empresa"
        title="Vagas da empresa"
        description="Solicite vagas com datas e requisitos detalhados. O SINE acompanha a triagem e os encaminhamentos."
      />
      <PortalAlert message={message} error={error} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <AppCard>
        <form onSubmit={createJob}>
          {lockedReason && (
            <AppAlert tone="warning" title="Abertura de vagas temporariamente suspensa" className="mb-4">
              {lockedReason}
            </AppAlert>
          )}
          {status.pending_returns > 0 && (
            <div className="mb-4 space-y-2">
              {(status.pending_feedbacks ?? []).map((item) => (
                <div
                  key={item.referral_id}
                  className="rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950"
                >
                  Retorno pendente: <strong>{item.worker_name}</strong> em{" "}
                  <strong>{item.job_title}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <AppInput required label="Cargo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="md:col-span-2" />
            <AppInput label="Data de início" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <AppInput label="Data final" type="date" value={form.closing_deadline} onChange={(e) => setForm({ ...form, closing_deadline: e.target.value })} />
            <AppInput label="Vagas" type="number" min={1} value={form.vacancies} onChange={(e) => setForm({ ...form, vacancies: Number(e.target.value) })} />
            <AppSelect label="Modalidade" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </AppSelect>
            <AppInput label="Local de trabalho" value={form.workplace} onChange={(e) => setForm({ ...form, workplace: e.target.value })} />
            <AppInput label="Jornada" value={form.workday} onChange={(e) => setForm({ ...form, workday: e.target.value })} />
            <AppInput label="Horário" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
            <AppInput label="Salário ou faixa" value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} />
            <AppTextarea required label="Descrição detalhada" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="md:col-span-2" />
            <AppTextarea required label="Requisitos detalhados" value={form.required_experience} onChange={(e) => setForm({ ...form, required_experience: e.target.value })} rows={3} className="md:col-span-2" />
            <AppInput label="Escolaridade mínima" value={form.minimum_education} onChange={(e) => setForm({ ...form, minimum_education: e.target.value })} />
            <AppInput label="CNH exigida" value={form.cnh_required} onChange={(e) => setForm({ ...form, cnh_required: e.target.value })} />
            <AppTextarea label="Cursos desejados" value={form.desired_courses} onChange={(e) => setForm({ ...form, desired_courses: e.target.value })} rows={2} className="md:col-span-2" />
            <AppTextarea label="Benefícios e observações" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={2} className="md:col-span-2" />
          </div>
          <AppButton
            type="submit"
            disabled={!status.can_open_job || saving}
            className="mt-4"
            icon={<Send size={17} />}
          >
            {saving ? "Enviando..." : "Enviar vaga ao SINE"}
          </AppButton>
        </form>
        </AppCard>
        <AppCard>
          <h2 className="text-lg font-bold text-slate-950">
            Histórico de vagas
          </h2>
          <div className="mt-3 space-y-2">
            {jobs.length === 0 && (
              <AppEmptyState
                title="Nenhuma vaga solicitada ainda"
                message="Quando a empresa enviar a primeira solicitação, ela aparecerá aqui com o acompanhamento do SINE."
              />
            )}
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-md border border-slate-100 bg-slate-50 p-3"
              >
                <div className="font-semibold text-slate-950">{job.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {friendlyStatus(job.status)} ·{" "}
                  {job.start_date
                    ? new Date(job.start_date).toLocaleDateString("pt-BR")
                    : "início a combinar"}
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      </div>
    </div>
  );
}

export function CompanyReferralsPage() {
  const { referrals, error, refresh, setError } = useCompanyPortal();
  const [feedback, setFeedback] = useState<
    Record<string, { status: string; comments: string }>
  >({});
  const [message, setMessage] = useState("");
  const pendingCount = referrals.filter((referral) =>
    ["encaminhado", "aguardando_retorno_empresa"].includes(referral.status),
  ).length;

  async function sendFeedback(referralId: string) {
    const item = feedback[referralId] ?? {
      status: "entrevistado",
      comments: "",
    };
    setError("");
    setMessage("");
    try {
      await api.post(`/company-portal/referrals/${referralId}/feedback`, item);
      setMessage(
        "Feedback registrado. O SINE já pode liberar o próximo ciclo de vagas quando não houver outros retornos pendentes.",
      );
      refresh();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Não foi possível registrar o feedback.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Portal da Empresa"
        title="Encaminhamentos recebidos"
        description="Avalie os trabalhadores encaminhados pelo SINE e registre o retorno para manter o atendimento em dia."
        action={
          <Link
            to="/empresa/comunicacao"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <MessageSquareReply size={16} /> Comunicação oficial
          </Link>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <AppMetricCard label="Encaminhamentos" value={referrals.length} />
          <AppMetricCard label="Aguardando retorno" value={pendingCount} />
          <AppMetricCard
            label="Retornos registrados"
            value={Math.max(referrals.length - pendingCount, 0)}
          />
        </div>
      </AppPageHeader>
      <PortalAlert message={message} error={error} />
      <AppCard>
        <div className="grid gap-3 lg:grid-cols-2">
          {referrals.map((referral) => {
            const current = feedback[referral.id] ?? {
              status:
                referral.status === "encaminhado"
                  ? "entrevistado"
                  : referral.status,
              comments: "",
            };
            const isPending = ["encaminhado", "aguardando_retorno_empresa"].includes(referral.status);
            return (
              <article
                key={referral.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-950">
                      {referral.worker_name}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {referral.job_title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Encaminhado em{" "}
                      {new Date(referral.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusBadge status={referral.status} />
                    {isPending ? <AppBadge tone="warning">Retorno pendente</AppBadge> : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <div>{referral.worker_email ?? "E-mail não informado"}</div>
                  <div>
                    {referral.worker_whatsapp ||
                      referral.worker_phone ||
                      "Telefone não informado"}
                  </div>
                  <div>
                    {referral.resume_filename
                      ? `Currículo: ${referral.resume_filename}`
                      : "Currículo sem PDF anexado"}
                  </div>
                  <div>
                    {referral.match_score
                      ? `Sugestão de compatibilidade da IA: ${referral.match_score}%`
                      : "Triagem acompanhada pelo SINE"}
                  </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-[180px_1fr]">
                  <AppSelect
                    label="Retorno"
                    value={current.status}
                    onChange={(e) =>
                      setFeedback({
                        ...feedback,
                        [referral.id]: { ...current, status: e.target.value },
                      })
                    }
                  >
                    <option value="entrevistado">Chamado para entrevista</option>
                    <option value="contratado">Contratado</option>
                    <option value="dispensado">Não selecionado</option>
                    <option value="nao_compareceu">Não compareceu</option>
                    <option value="perfil_incompativel">Perfil incompatível</option>
                    <option value="vaga_preenchida">Vaga preenchida</option>
                    <option value="outro_motivo">Outro motivo</option>
                  </AppSelect>
                  <AppInput
                    label="Comentário para o SINE"
                    value={current.comments}
                    onChange={(e) =>
                      setFeedback({
                        ...feedback,
                        [referral.id]: { ...current, comments: e.target.value },
                      })
                    }
                    placeholder="Comentário para o SINE"
                  />
                </div>
                <AppButton
                  type="button"
                  onClick={() => sendFeedback(referral.id)}
                  className="mt-3"
                  icon={<MessageSquareReply size={16} />}
                >
                  Registrar feedback
                </AppButton>
              </article>
            );
          })}
          {referrals.length === 0 && (
            <div className="lg:col-span-2">
              <AppEmptyState
                title="Nenhum trabalhador encaminhado ainda"
                message="Quando o SINE encaminhar currículos para uma vaga da empresa, eles aparecerão aqui para avaliação."
              />
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
}
