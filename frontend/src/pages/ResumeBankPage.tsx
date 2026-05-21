import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  BrainCircuit,
  CheckCircle2,
  Eye,
  FileText,
  Send,
  UserPlus,
  XCircle,
} from "lucide-react";
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
  AppTextarea,
} from "../components/ui";
import { LgpdNotice } from "../components/lgpd/LgpdNotice";
import { api } from "../services/api";
import type {
  Job,
  ResumeBankEntry,
  ResumeBankSuggestion,
  Worker,
  WorkerResumeBankStatus,
} from "../types";
import { friendlyStatus, statusTone } from "../utils/statusLabels";

const statuses = [
  "ativo",
  "em_analise",
  "sugerido_para_vaga",
  "encaminhado",
  "pausado",
  "desatualizado",
  "arquivado",
  "contratado",
];

function chipList(items?: string[]) {
  return items?.length ? items.join(", ") : "Não informado";
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "Não informado";
}

export function ResumeBankPage() {
  const [entries, setEntries] = useState<ResumeBankEntry[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    worker_id: "",
    desired_roles: "",
    tags: "",
    city: "Jacarezinho",
    experience_summary: "",
    internal_notes: "",
  });

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<ResumeBankEntry[]>("/resume-bank", {
        params: { search: search || undefined, status: status || undefined, city: city || undefined },
      }),
      api.get<Worker[]>("/workers"),
    ])
      .then(([bank, workerList]) => {
        setEntries(bank.data);
        setWorkers(workerList.data);
      })
      .catch((err) =>
        setError(err.response?.data?.detail ?? "Não foi possível carregar o Banco de Currículos."),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const count = (value: string) => entries.filter((item) => item.status === value).length;
    return {
      ativo: count("ativo"),
      em_analise: count("em_analise"),
      sugerido_para_vaga: count("sugerido_para_vaga"),
      encaminhado: count("encaminhado"),
      desatualizado: count("desatualizado"),
      arquivado: count("arquivado"),
    };
  }, [entries]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.worker_id) {
      setError("Selecione um candidato para adicionar ao Banco de Currículos.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await api.post("/resume-bank", {
        worker_id: form.worker_id,
        desired_roles: form.desired_roles.split(",").map((item) => item.trim()).filter(Boolean),
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
        city: form.city,
        entry_reason: "atualizacao_manual_sine",
        experience_summary: form.experience_summary,
        internal_notes: form.internal_notes,
      });
      setMessage("Currículo adicionado ao Banco de Currículos.");
      setForm({ worker_id: "", desired_roles: "", tags: "", city: "Jacarezinho", experience_summary: "", internal_notes: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Não foi possível adicionar ao Banco de Currículos.");
    }
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Operação SINE"
        title="Banco de Currículos"
        description="Currículos disponíveis para futuras oportunidades, com busca ativa de compatibilidade por IA e revisão obrigatória do SINE."
        action={
          <Link to="/banco-curriculos/sugestoes">
            <AppButton icon={<BrainCircuit size={17} />}>Sugestões da IA</AppButton>
          </Link>
        }
      />
      <LgpdNotice compact />
      {message && <AppAlert tone="success">{message}</AppAlert>}
      {error && <AppAlert tone="error">{error}</AppAlert>}

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <AppMetricCard label="Ativos" value={metrics.ativo} />
        <AppMetricCard label="Em análise" value={metrics.em_analise} />
        <AppMetricCard label="Sugeridos" value={metrics.sugerido_para_vaga} />
        <AppMetricCard label="Encaminhados" value={metrics.encaminhado} />
        <AppMetricCard label="Desatualizados" value={metrics.desatualizado} />
        <AppMetricCard label="Arquivados" value={metrics.arquivado} />
      </div>

      <AppCard>
        <form onSubmit={(event) => { event.preventDefault(); load(); }} className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
          <AppInput label="Buscar" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, CPF, cargo, cidade ou tag" />
          <AppSelect label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            {statuses.map((item) => <option key={item} value={item}>{friendlyStatus(item)}</option>)}
          </AppSelect>
          <AppInput label="Cidade" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Jacarezinho" />
          <AppButton type="submit" className="self-end">Filtrar</AppButton>
        </form>
      </AppCard>

      <AppCard>
        <div className="mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-emerald-700" />
          <h2 className="font-bold text-slate-950">Adicionar ao Banco de Currículos</h2>
        </div>
        <form onSubmit={submit} className="grid gap-3 lg:grid-cols-2">
          <AppSelect label="Candidato" value={form.worker_id} onChange={(event) => setForm({ ...form, worker_id: event.target.value })} required>
            <option value="">Selecione</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.full_name} · {worker.desired_role || "cargo não informado"}
              </option>
            ))}
          </AppSelect>
          <AppInput label="Cargos de interesse" value={form.desired_roles} onChange={(event) => setForm({ ...form, desired_roles: event.target.value })} placeholder="Atendente, Auxiliar administrativo" />
          <AppInput label="Tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="atendimento, vendas" />
          <AppInput label="Cidade" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          <AppTextarea label="Resumo profissional" value={form.experience_summary} onChange={(event) => setForm({ ...form, experience_summary: event.target.value })} className="lg:col-span-2" />
          <AppTextarea label="Observações internas do SINE" value={form.internal_notes} onChange={(event) => setForm({ ...form, internal_notes: event.target.value })} className="lg:col-span-2" />
          <div className="lg:col-span-2">
            <AppButton type="submit" icon={<UserPlus size={17} />}>Adicionar ao Banco de Currículos</AppButton>
          </div>
        </form>
      </AppCard>

      {loading ? (
        <AppCard>Carregando currículos...</AppCard>
      ) : entries.length === 0 ? (
        <AppEmptyState
          title="Nenhum currículo no Banco de Currículos."
          message="Adicione manualmente ou mova candidatos não contratados a partir de encaminhamentos para futuras oportunidades."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {entries.map((entry) => (
            <AppCard key={entry.id} interactive>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{entry.worker_name}</h2>
                  <p className="text-sm text-slate-600">{chipList(entry.desired_roles)} · {entry.city || "Cidade não informada"}</p>
                </div>
                <AppBadge tone={statusTone(entry.status)}>{friendlyStatus(entry.status)}</AppBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {entry.experience_summary || entry.ai_summary || "Resumo profissional ainda não informado."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.tags.map((tag) => <AppBadge key={tag} tone="neutral">{tag}</AppBadge>)}
                <AppBadge tone="info">{entry.education_level || "Escolaridade não informada"}</AppBadge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/banco-curriculos/${entry.id}`}>
                  <AppButton variant="secondary" icon={<Eye size={16} />}>Ver currículo</AppButton>
                </Link>
              </div>
            </AppCard>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResumeBankDetailPage() {
  const { id } = useParams();
  const [entry, setEntry] = useState<ResumeBankEntry | null>(null);
  const [status, setStatus] = useState("ativo");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    if (!id) return;
    api.get<ResumeBankEntry>(`/resume-bank/${id}`)
      .then(({ data }) => {
        setEntry(data);
        setStatus(data.status);
        setNotes(data.internal_notes || "");
      })
      .catch((err) => setError(err.response?.data?.detail ?? "Não foi possível abrir o currículo."));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveStatus() {
    if (!id) return;
    await api.post(`/resume-bank/${id}/status`, { status });
    setMessage("Status atualizado.");
    load();
  }

  async function saveNotes() {
    if (!id) return;
    await api.post(`/resume-bank/${id}/notes`, { internal_notes: notes });
    setMessage("Observações internas atualizadas.");
    load();
  }

  async function archive() {
    if (!id) return;
    await api.patch(`/resume-bank/${id}/archive`);
    setMessage("Currículo arquivado no Banco de Currículos.");
    load();
  }

  if (error) return <AppAlert tone="error">{error}</AppAlert>;
  if (!entry) return <AppCard>Carregando currículo...</AppCard>;

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Banco de Currículos"
        title={entry.worker_name}
        description="Dados completos visíveis apenas ao SINE para revisão, histórico e encaminhamento oficial."
        action={<Link to="/banco-curriculos"><AppButton variant="secondary">Voltar</AppButton></Link>}
      />
      <LgpdNotice compact />
      {message && <AppAlert tone="success">{message}</AppAlert>}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <AppCard>
          <div className="flex flex-wrap items-center gap-2">
            <AppBadge tone={statusTone(entry.status)}>{friendlyStatus(entry.status)}</AppBadge>
            <AppBadge tone="info">Disponível para futuras oportunidades</AppBadge>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Info label="CPF" value={entry.worker_cpf_masked} />
            <Info label="Cidade" value={entry.city} />
            <Info label="Escolaridade" value={entry.education_level} />
            <Info label="Disponibilidade" value={entry.availability} />
            <Info label="Cargos desejados" value={chipList(entry.desired_roles)} />
            <Info label="Tags" value={chipList(entry.tags)} />
          </div>
          <section className="mt-5">
            <h2 className="font-bold text-slate-950">Resumo profissional</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{entry.experience_summary || "Resumo ainda não informado."}</p>
          </section>
          <section className="mt-5">
            <h2 className="font-bold text-slate-950">Currículo</h2>
            <p className="mt-2 text-sm text-slate-600">{entry.resume_filename || "Sem PDF vinculado."}</p>
          </section>
        </AppCard>
        <div className="space-y-4">
          <AppCard>
            <AppSelect label="Atualizar status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {statuses.map((item) => <option key={item} value={item}>{friendlyStatus(item)}</option>)}
            </AppSelect>
            <AppButton className="mt-3 w-full" icon={<CheckCircle2 size={16} />} onClick={saveStatus}>Atualizar status</AppButton>
            <AppButton className="mt-2 w-full" variant="danger" icon={<Archive size={16} />} onClick={archive}>Arquivar</AppButton>
          </AppCard>
          <AppCard>
            <AppTextarea label="Observações internas" value={notes} onChange={(event) => setNotes(event.target.value)} rows={6} />
            <AppButton className="mt-3 w-full" onClick={saveNotes}>Salvar observação</AppButton>
          </AppCard>
        </div>
      </div>
    </div>
  );
}

export function ResumeBankSuggestionsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<ResumeBankSuggestion[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    const suggestionsUrl = jobId ? `/resume-bank/suggestions/job/${jobId}` : "/resume-bank/suggestions";
    Promise.all([api.get<ResumeBankSuggestion[]>(suggestionsUrl), api.get<Job[]>("/jobs")])
      .then(([suggestionList, jobList]) => {
        setSuggestions(suggestionList.data);
        setJobs(jobList.data);
        setSelectedJobId((current) => current || jobId || jobList.data[0]?.id || "");
      })
      .catch((err) => setError(err.response?.data?.detail ?? "Não foi possível carregar as sugestões da IA."));
  }

  useEffect(() => {
    load();
  }, [jobId]);

  async function runMatch() {
    if (!selectedJobId) return;
    setError("");
    setMessage("");
    try {
      const { data } = await api.post(`/resume-bank/match-job/${selectedJobId}`, { limit: 20 });
      setMessage(`A IA encontrou ${data.total_suggestions} currículo(s) compatível(is) para revisão do SINE.`);
      navigate(`/banco-curriculos/vaga/${selectedJobId}/sugestoes`);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Não foi possível buscar currículos compatíveis.");
    }
  }

  async function review(id: string, status: "aprovado_pelo_sine" | "recusado_pelo_sine") {
    await api.patch(`/resume-bank/suggestions/${id}/review`, { status });
    setMessage(status === "aprovado_pelo_sine" ? "Sugestão aprovada pelo SINE." : "Sugestão recusada pelo SINE.");
    load();
  }

  async function forward(id: string) {
    await api.post(`/resume-bank/suggestions/${id}/forward`);
    setMessage("Candidato encaminhado oficialmente para a empresa. A empresa só verá os dados após esse encaminhamento.");
    load();
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Banco de Currículos"
        title="Currículos compatíveis encontrados pela IA"
        description="A IA encontrou currículos compatíveis no Banco de Currículos. Revise os candidatos abaixo e selecione quais serão encaminhados oficialmente para a empresa."
      />
      <AppAlert tone="info">
        A IA sugere candidatos com base nas informações disponíveis. A decisão de encaminhamento é sempre do SINE.
      </AppAlert>
      {message && <AppAlert tone="success">{message}</AppAlert>}
      {error && <AppAlert tone="error">{error}</AppAlert>}
      <AppCard>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <AppSelect label="Vaga" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </AppSelect>
          <AppButton className="self-end" icon={<BrainCircuit size={17} />} onClick={runMatch}>Buscar currículos compatíveis com IA</AppButton>
        </div>
      </AppCard>
      {suggestions.length === 0 ? (
        <AppEmptyState title="Nenhuma sugestão pendente." message="Execute a busca com IA para uma vaga e revise os currículos encontrados aqui." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {suggestions.map((suggestion) => (
            <AppCard key={suggestion.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{suggestion.worker_name}</h2>
                  <p className="text-sm text-slate-600">{suggestion.job_title} · {suggestion.city || "Cidade não informada"}</p>
                </div>
                <AppBadge tone={statusTone(suggestion.status)}>{friendlyStatus(suggestion.status)}</AppBadge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <AppBadge tone="success">{suggestion.compatibility_level}</AppBadge>
                <AppBadge tone="info">{suggestion.compatibility_score}% de compatibilidade</AppBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{suggestion.ai_explanation || suggestion.professional_summary || "A IA encontrou compatibilidade pelos dados disponíveis."}</p>
              <List title="Requisitos atendidos" items={suggestion.matched_requirements} />
              <List title="Pontos para conferir" items={suggestion.missing_requirements} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/banco-curriculos/${suggestion.resume_bank_entry_id}`}>
                  <AppButton variant="secondary" icon={<FileText size={16} />}>Ver currículo</AppButton>
                </Link>
                <AppButton variant="secondary" icon={<CheckCircle2 size={16} />} onClick={() => review(suggestion.id, "aprovado_pelo_sine")}>Aprovar sugestão</AppButton>
                <AppButton variant="ghost" icon={<XCircle size={16} />} onClick={() => review(suggestion.id, "recusado_pelo_sine")}>Recusar sugestão</AppButton>
                <AppButton icon={<Send size={16} />} onClick={() => forward(suggestion.id)}>Encaminhar para empresa</AppButton>
              </div>
            </AppCard>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkerResumeBankPage() {
  const [status, setStatus] = useState<WorkerResumeBankStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<WorkerResumeBankStatus>("/worker-portal/resume-bank/me")
      .then(({ data }) => setStatus(data))
      .catch((err) => setError(err.response?.data?.detail ?? "Não foi possível carregar sua situação."));
  }, []);

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Portal do Candidato"
        title="Meu Banco de Currículos"
        description="Acompanhe se seu currículo está disponível para futuras oportunidades compatíveis."
        action={<Link to="/meu-curriculo"><AppButton variant="secondary">Atualizar perfil profissional</AppButton></Link>}
      />
      <LgpdNotice />
      {error && <AppAlert tone="error">{error}</AppAlert>}
      {!status ? (
        <AppCard>Carregando sua situação...</AppCard>
      ) : (
        <AppCard>
          <AppBadge tone={statusTone(status.status)}>{friendlyStatus(status.status)}</AppBadge>
          <p className="mt-4 text-sm leading-6 text-slate-700">{status.message}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Info label="Última atualização" value={formatDate(status.updated_at)} />
            <Info label="Entrada no Banco" value={formatDate(status.entered_at)} />
            <Info label="Cargos de interesse" value={chipList(status.desired_roles)} />
          </div>
          <AppAlert tone="info" className="mt-5">
            Seus dados só serão compartilhados com empresas quando houver encaminhamento oficial do SINE.
          </AppAlert>
        </AppCard>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-700">{value || "Não informado"}</div>
    </div>
  );
}

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <div className="text-xs font-bold uppercase text-slate-500">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
