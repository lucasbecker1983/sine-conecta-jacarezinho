import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";
import type { CandidateAnalysis, Company, Job, JobCandidate } from "../types";
import { JobTriageCanvas } from "../canvas/JobTriageCanvas";
import { CandidateResumeModal } from "./CandidateResumeModal";
import { AppBadge } from "../components/ui";
import { friendlyStatus } from "../utils/statusLabels";

const triageStatuses = [
  "solicitada",
  "em_analise",
  "aprovada",
  "publicada",
  "em_triagem",
  "encaminhando_candidatos",
];

type CandidateView = JobCandidate &
  Partial<Omit<CandidateAnalysis, "match_score" | "match_explanation">> & {
    match_score?: number | null;
    match_explanation?: string | null;
  };

export function SineJobTriagePage() {
  const { jobId } = useParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId ?? "");
  const [candidates, setCandidates] = useState<CandidateView[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(
    new Set(),
  );
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [modalCandidate, setModalCandidate] = useState<JobCandidate | null>(
    null,
  );
  const [filter, setFilter] = useState("todos");
  const [sort, setSort] = useState("score");
  const [correction, setCorrection] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);
  const [messageToCompany, setMessageToCompany] = useState(
    "Segue encaminhamento dos candidatos selecionados pelo SINE.",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedJob = jobs.find((item) => item.id === selectedJobId);
  const selectedCompany = companies.find(
    (item) => item.id === selectedJob?.company_id,
  );

  function loadJobs() {
    Promise.all([api.get<Job[]>("/jobs"), api.get<Company[]>("/companies")])
      .then(([jobResult, companyResult]) => {
        const filtered = jobResult.data.filter((item) =>
          triageStatuses.includes(item.status),
        );
        setJobs(filtered);
        setCompanies(companyResult.data);
        setSelectedJobId((current) => current || filtered[0]?.id || "");
      })
      .catch(() =>
        setError("Não foi possível carregar as vagas para triagem."),
      );
  }

  function loadCandidates(id = selectedJobId) {
    if (!id) return;
    api
      .get<JobCandidate[]>(`/jobs/${id}/candidates`)
      .then(({ data }) => setCandidates(data))
      .catch((err) =>
        setError(
          err.response?.data?.detail ??
            "Não foi possível carregar candidatos da vaga.",
        ),
      );
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) loadCandidates(selectedJobId);
  }, [selectedJobId]);

  const visibleCandidates = useMemo(() => {
    const byFilter = candidates.filter((candidate) => {
      const score = candidate.match_score ?? 0;
      const status = candidate.application_status;
      if (filter === "alta") return score >= 80;
      if (filter === "media") return score >= 60 && score < 80;
      if (filter === "baixa") return score > 0 && score < 60;
      if (filter === "encaminhados") return status === "encaminhado";
      if (filter === "nao_encaminhados") return status !== "encaminhado";
      if (filter === "incompletos")
        return (
          !candidate.resume_id ||
          !candidate.worker_phone ||
          !candidate.has_lgpd_consent
        );
      return true;
    });
    return [...byFilter].sort((a, b) => {
      if (sort === "recente")
        return (
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
        );
      if (sort === "nome") return a.worker_name.localeCompare(b.worker_name);
      if (sort === "cidade") return (a.city ?? "").localeCompare(b.city ?? "");
      return (b.match_score ?? 0) - (a.match_score ?? 0);
    });
  }, [candidates, filter, sort]);

  async function updateStatus(status: string, notes?: string) {
    if (!selectedJobId) return;
    setError("");
    setMessage("");
    try {
      await api.patch(`/jobs/${selectedJobId}/status`, { status, notes });
      setMessage(
        status === "correcao_solicitada"
          ? "Correção solicitada e empresa notificada."
          : "Status da vaga atualizado.",
      );
      setShowCorrection(false);
      setCorrection("");
      loadJobs();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Não foi possível atualizar a vaga.",
      );
    }
  }

  async function analyzeCandidates() {
    if (!selectedJobId) return;
    setError("");
    setMessage("");
    try {
      const { data } = await api.post<{ candidates: CandidateAnalysis[] }>(
        `/ai/jobs/${selectedJobId}/analyze-candidates`,
      );
      const byWorker = new Map(
        data.candidates.map((item) => [item.worker_id, item]),
      );
      setCandidates((current) =>
        current.map((candidate) => ({
          ...candidate,
          ...byWorker.get(candidate.worker_id),
        })),
      );
      setMessage(
        "A IA encontrou candidatos e atualizou a compatibilidade. Revise os perfis antes de encaminhar.",
      );
      loadCandidates(selectedJobId);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Não foi possível executar a análise IA.",
      );
    }
  }

  async function referSelected(event: FormEvent) {
    event.preventDefault();
    if (!selectedJobId || selectedWorkers.size === 0) return;
    const selected = candidates.filter((candidate) =>
      selectedWorkers.has(candidate.worker_id),
    );
    try {
      await api.post(`/jobs/${selectedJobId}/refer-candidates`, {
        message_to_company: messageToCompany,
        candidates: selected.map((candidate) => ({
          worker_id: candidate.worker_id,
          resume_id: candidate.resume_id,
          match_score: candidate.match_score,
          match_explanation: candidate.match_explanation,
        })),
      });
      setMessage("Encaminhamento realizado. A empresa foi notificada.");
      setSelectedWorkers(new Set());
      loadCandidates(selectedJobId);
      loadJobs();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ??
          "Não foi possível encaminhar os candidatos.",
      );
    }
  }

  function toggle(workerId: string) {
    setSelectedWorkers((current) => {
      const next = new Set(current);
      next.has(workerId) ? next.delete(workerId) : next.add(workerId);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <header className="rounded-md border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
              <Bot size={15} /> IA interna do SINE
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">
              Triagem por Vaga
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Selecione uma vaga, analise candidatos com apoio da IA e encaminhe
              os perfis mais aderentes para a empresa.
            </p>
            <p className="mt-2 text-sm font-semibold text-amber-800">
              A IA é apenas apoio à triagem. A decisão final é do colaborador do
              SINE.
            </p>
          </div>
          <Link
            to="/comunicacao"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400"
          >
            <MessageSquare size={16} /> Abrir comunicação
          </Link>
        </div>
      </header>
      {(message || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
        >
          {error || message}
        </div>
      )}
      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-bold text-slate-950">
              Escolha uma vaga para iniciar a triagem.
            </label>
            <select
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              {jobs.map((job) => {
                const company = companies.find(
                  (item) => item.id === job.company_id,
                );
                return (
                  <option key={job.id} value={job.id}>
                    {company?.trade_name || company?.legal_name || "Empresa"} ·{" "}
                    {job.title}
                  </option>
                );
              })}
            </select>
            {jobs.length === 0 && (
              <div className="mt-3 text-sm text-slate-500">
                Nenhuma vaga em status de triagem.
              </div>
            )}
          </div>
          {selectedJob && (
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-bold text-slate-950">
                {selectedJob.title}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {selectedCompany?.trade_name || selectedCompany?.legal_name} ·{" "}
                {selectedCompany?.city ??
                  selectedJob.workplace ??
                  "Jacarezinho"}
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                <span>Vagas: {selectedJob.vacancies}</span>
                <span>Status: {friendlyStatus(selectedJob.status)}</span>
                <span>
                  Criada em:{" "}
                  {new Date(selectedJob.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                <button
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-emerald-400"
                  onClick={() => updateStatus("aprovada")}
                >
                  Aprovar vaga
                </button>
                <button
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-emerald-400"
                  onClick={() => updateStatus("publicada")}
                >
                  Publicar vaga
                </button>
                <button
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-emerald-400"
                  onClick={() => updateStatus("em_triagem")}
                >
                  Iniciar triagem
                </button>
                <button
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
                  onClick={() => setShowCorrection(true)}
                >
                  Pedir correção
                </button>
                <button
                  className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                  onClick={() => updateStatus("cancelada")}
                >
                  Cancelar vaga
                </button>
              </div>
            </div>
          )}
          {showCorrection && (
            <form
              className="rounded-md border border-amber-200 bg-amber-50 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                updateStatus("correcao_solicitada", correction);
              }}
            >
              <label className="text-sm font-bold text-amber-950">
                O que precisa ser corrigido?
              </label>
              <textarea
                required
                value={correction}
                onChange={(event) => setCorrection(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-md border border-amber-200 px-3 py-2 text-sm"
              />
              <button className="mt-3 rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white">
                Enviar solicitação
              </button>
            </form>
          )}
        </aside>
        <main className="space-y-5">
          {selectedJob && (
            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Dados e requisitos da vaga
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedJob.description}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Info
                      label="Escolaridade"
                      value={selectedJob.minimum_education}
                    />
                    <Info
                      label="Experiência"
                      value={selectedJob.required_experience}
                    />
                    <Info
                      label="Cursos desejados"
                      value={selectedJob.desired_courses}
                    />
                    <Info label="CNH" value={selectedJob.cnh_required} />
                    <Info
                      label="Jornada"
                      value={selectedJob.workday || selectedJob.schedule}
                    />
                    <Info
                      label="Salário/faixa"
                      value={selectedJob.salary_range}
                    />
                    <Info label="Observações" value={selectedJob.notes} />
                    <Info label="Status atual" value={friendlyStatus(selectedJob.status)} />
                  </div>
                </div>
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
                  <ShieldCheck size={17} className="mr-1 inline" />
                  Revise os perfis antes de encaminhar. Nenhum candidato é
                  rejeitado automaticamente.
                </div>
              </div>
            </section>
          )}
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Comparação candidato x vaga
                </h2>
                <p className="text-sm text-slate-600">
                  A IA encontrou candidatos com compatibilidade estimada. Revise
                  os perfis antes de encaminhar.
                </p>
              </div>
              <button
                onClick={analyzeCandidates}
                disabled={!selectedJobId || candidates.length === 0}
                className="tenant-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Sparkles size={16} /> Analisar com IA
              </button>
            </div>
            <JobTriageCanvas
              jobTitle={selectedJob?.title ?? "Vaga"}
              candidates={candidates}
              selectedWorkerId={selectedWorkerId}
              onSelect={setSelectedWorkerId}
            />
          </section>
          <form onSubmit={referSelected} className="space-y-4">
            <div className="flex flex-wrap gap-3 rounded-md border border-slate-200 bg-white p-3">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="alta">Alta compatibilidade</option>
                <option value="media">Média compatibilidade</option>
                <option value="baixa">Baixa compatibilidade</option>
                <option value="encaminhados">Já encaminhados</option>
                <option value="nao_encaminhados">Ainda não encaminhados</option>
                <option value="incompletos">Com dados incompletos</option>
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="score">Maior compatibilidade</option>
                <option value="recente">Mais recente</option>
                <option value="nome">Nome</option>
                <option value="cidade">Cidade</option>
              </select>
              <input
                value={messageToCompany}
                onChange={(event) => setMessageToCompany(event.target.value)}
                className="min-w-[280px] flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                disabled={selectedWorkers.size === 0}
                className="tenant-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Send size={16} /> Encaminhar selecionados
              </button>
              <p className="w-full text-xs leading-5 text-slate-500">
                Ao encaminhar, a empresa será notificada, receberá apenas os
                dados autorizados para esta vaga e deverá informar o retorno ao
                SINE.
              </p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.worker_id}
                  candidate={candidate}
                  selected={selectedWorkers.has(candidate.worker_id)}
                  highlighted={selectedWorkerId === candidate.worker_id}
                  onToggle={() => toggle(candidate.worker_id)}
                  onOpen={() => setModalCandidate(candidate)}
                />
              ))}
              {visibleCandidates.length === 0 && (
                <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 xl:col-span-2">
                  Nenhum candidato inscrito nesta vaga ainda.
                </div>
              )}
            </div>
          </form>
        </main>
      </section>
      <CandidateResumeModal
        jobId={selectedJobId}
        candidate={modalCandidate}
        onClose={() => setModalCandidate(null)}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-700">
        {value || "Não informado"}
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  selected,
  highlighted,
  onToggle,
  onOpen,
}: {
  candidate: CandidateView;
  selected: boolean;
  highlighted: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const score = candidate.match_score ?? 0;
  const level =
    candidate.match_level ??
    (score >= 80 ? "alta" : score >= 60 ? "media" : "baixa");
  return (
    <article
      className={`rounded-md border bg-white p-4 shadow-sm ${highlighted ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">{candidate.worker_name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {candidate.city || "Cidade não informada"} ·{" "}
            {candidate.worker_whatsapp ||
              candidate.worker_phone ||
              "Telefone não informado"}
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <input type="checkbox" checked={selected} onChange={onToggle} />{" "}
          selecionar
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
          score {score || "-"}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {level}
        </span>
        <AppBadge tone="info">{friendlyStatus(candidate.application_status)}</AppBadge>
        {candidate.source === "public_portal" && (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900">
            Candidatura direta
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {candidate.summary ||
          candidate.ai_summary ||
          "Execute a análise IA para gerar resumo profissional."}
      </p>
      {candidate.strengths && candidate.strengths.length > 0 && (
        <List title="Pontos fortes" items={candidate.strengths} />
      )}
      {candidate.gaps && candidate.gaps.length > 0 && (
        <List title="Pontos de atenção" items={candidate.gaps} />
      )}
      {candidate.suggested_interview_questions &&
        candidate.suggested_interview_questions.length > 0 && (
          <List
            title="Perguntas sugeridas"
            items={candidate.suggested_interview_questions}
          />
        )}
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400"
      >
        Ver currículo
      </button>
    </article>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-bold uppercase text-slate-500">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
