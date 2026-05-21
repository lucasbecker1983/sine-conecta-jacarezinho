import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  LockKeyhole,
  MessageSquareReply,
  MessagesSquare,
  Send,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";
import type {
  CommunicationMessage,
  CommunicationThread,
  Company,
  DataAccessLog,
} from "../types";

type Props = {
  mode: "sine" | "company";
};

const endpoints = {
  sine: {
    threads: "/communication/threads",
    messages: (id: string) => `/communication/threads/${id}/messages`,
  },
  company: {
    threads: "/company-portal/communication/threads",
    messages: (id: string) =>
      `/company-portal/communication/threads/${id}/messages`,
  },
};

const communicationTopics = [
  { value: "feedback_contratacao", label: "Feedback de contratação" },
  { value: "correcao_vaga", label: "Correção de vaga" },
  { value: "agenda_entrevista", label: "Agenda de entrevista" },
  {
    value: "duvida_perfil_requisitos",
    label: "Dúvida sobre perfil/requisitos",
  },
  {
    value: "solicitacao_novos_candidatos",
    label: "Solicitar novos candidatos",
  },
  {
    value: "cancelamento_suspensao_vaga",
    label: "Cancelamento ou suspensão da vaga",
  },
  { value: "documentos_lgpd", label: "Documentos e LGPD" },
  { value: "comunicacao_interna", label: "Comunicação interna" },
];

const topicLabels = Object.fromEntries(
  communicationTopics.map((topic) => [topic.value, topic.label]),
);

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "sem registro";
}

export function CommunicationPage({ mode }: Props) {
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [body, setBody] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTopic, setNewTopic] = useState("feedback_contratacao");
  const [companyId, setCompanyId] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterJob, setFilterJob] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(
    () => threads.find((thread) => thread.id === selectedId),
    [selectedId, threads],
  );
  const isSine = mode === "sine";
  const apiSet = endpoints[mode];
  const jobOptions = useMemo(
    () =>
      Array.from(
        new Map(
          threads
            .filter((thread) => thread.job_id && thread.job_title)
            .map((thread) => [thread.job_id, thread.job_title]),
        ).entries(),
      ),
    [threads],
  );
  const visibleThreads = useMemo(
    () =>
      threads.filter((thread) => {
        if (filterTopic && thread.topic !== filterTopic) return false;
        if (filterCompany && thread.company_id !== filterCompany) return false;
        if (filterJob && thread.job_id !== filterJob) return false;
        if (filterStatus && thread.status !== filterStatus) return false;
        return true;
      }),
    [filterCompany, filterJob, filterStatus, filterTopic, threads],
  );

  function loadThreads() {
    const params = isSine
      ? {
          topic: filterTopic || undefined,
          company_id: filterCompany || undefined,
          job_id: filterJob || undefined,
          status: filterStatus || undefined,
        }
      : undefined;
    api
      .get<CommunicationThread[]>(apiSet.threads, { params })
      .then(({ data }) => {
        setThreads(data);
        setSelectedId((current) => current || data[0]?.id || "");
      })
      .catch(() => setError("Não foi possível carregar as conversas."));
  }

  useEffect(() => {
    loadThreads();
    if (isSine) {
      api
        .get<Company[]>("/companies")
        .then(({ data }) => {
          setCompanies(data);
          setCompanyId(data[0]?.id || "");
        })
        .catch(() => setCompanies([]));
    }
  }, [isSine, filterTopic, filterCompany, filterJob, filterStatus]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    api
      .get<CommunicationMessage[]>(apiSet.messages(selectedId))
      .then(({ data }) => setMessages(data))
      .catch(() => setError("Não foi possível abrir a conversa."));
  }, [apiSet, selectedId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setError("");
    setMessage("");
    try {
      await api.post(apiSet.messages(selectedId), { body });
      setBody("");
      setMessage("Mensagem registrada na conversa oficial.");
      loadThreads();
      const { data } = await api.get<CommunicationMessage[]>(
        apiSet.messages(selectedId),
      );
      setMessages(data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Não foi possível enviar a mensagem.",
      );
    }
  }

  async function createThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = isSine
        ? {
            company_id: companyId,
            topic: newTopic,
            subject: newSubject,
            body: newBody,
          }
        : { topic: newTopic, subject: newSubject, body: newBody };
      const { data } = await api.post<CommunicationThread>(
        apiSet.threads,
        payload,
      );
      setNewSubject("");
      setNewBody("");
      setNewTopic("feedback_contratacao");
      setSelectedId(data.id);
      setMessage("Conversa oficial criada com trilha de auditoria.");
      loadThreads();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Não foi possível criar a conversa.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            {isSine ? "Comunicação com empresas" : "Comunicação com o SINE"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Canal oficial, auditável e ligado a vagas, encaminhamentos e
            currículos quando aplicável.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          <ShieldCheck size={17} /> LGPD auditável
        </div>
      </div>

      {(message || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
        >
          {error || message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <form
            onSubmit={createThread}
            className="rounded-md border border-slate-200 bg-white p-4"
          >
            <div className="mb-3 flex items-center gap-2 font-bold text-slate-950">
              <MessagesSquare size={18} className="text-emerald-700" /> Nova
              conversa
            </div>
            {isSine && (
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Empresa
                <select
                  required
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.trade_name || company.legal_name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Tema
              <select
                required
                value={newTopic}
                onChange={(event) => setNewTopic(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              >
                {communicationTopics.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Assunto
              <input
                required
                value={newSubject}
                onChange={(event) => setNewSubject(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Mensagem
              <textarea
                required
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="tenant-button mt-3 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold"
            >
              <Send size={16} /> Criar
            </button>
          </form>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-950">
              Conversas
            </div>
            <div className="grid gap-2 border-b border-slate-100 p-3">
              <select
                value={filterTopic}
                onChange={(event) => setFilterTopic(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Todos os temas</option>
                {communicationTopics.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
              {isSine && (
                <select
                  value={filterCompany}
                  onChange={(event) => setFilterCompany(event.target.value)}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Todas as empresas</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.trade_name || company.legal_name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={filterJob}
                onChange={(event) => setFilterJob(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Todas as vagas</option>
                {jobOptions.map(([id, title]) => (
                  <option key={id} value={id ?? ""}>
                    {title}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Todos os status</option>
                <option value="aberta">Aberta</option>
                <option value="resolvida">Resolvida</option>
                <option value="arquivada">Arquivada</option>
              </select>
            </div>
            <div className="max-h-[560px] overflow-auto">
              {visibleThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedId(thread.id)}
                  className={`w-full border-b border-slate-100 p-4 text-left hover:bg-emerald-50/60 ${selectedId === thread.id ? "bg-emerald-50" : "bg-white"}`}
                >
                  <div className="font-semibold text-slate-950">
                    {thread.subject}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {thread.company_name}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">
                      {topicLabels[thread.topic] ?? thread.topic}
                    </span>
                    {thread.job_title && (
                      <span className="rounded-full bg-white px-2 py-1">
                        {thread.job_title}
                      </span>
                    )}
                    {thread.worker_name && (
                      <span className="rounded-full bg-white px-2 py-1">
                        {thread.worker_name}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {visibleThreads.length === 0 && (
                <div className="p-4 text-sm text-slate-500">
                  Nenhuma conversa encontrada para os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="rounded-md border border-slate-200 bg-white">
          {!selected && (
            <div className="p-6 text-sm text-slate-500">
              Selecione ou crie uma conversa.
            </div>
          )}
          {selected && (
            <div className="flex min-h-[620px] flex-col">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      {selected.subject}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selected.company_name}{" "}
                      {selected.job_title ? `· ${selected.job_title}` : ""}
                    </p>
                    <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {topicLabels[selected.topic] ?? selected.topic}
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {selected.status}
                  </span>
                </div>
                {(selected.worker_name || selected.resume_filename) && (
                  <div className="mt-3 grid gap-2 rounded-md border border-amber-100 bg-amber-50 p-3 text-sm text-amber-950 md:grid-cols-2">
                    <div>
                      <FileText size={15} className="mr-1 inline" />{" "}
                      {selected.worker_name ?? "Candidato vinculado"}
                    </div>
                    <div>
                      {selected.resume_filename ??
                        "Currículo vinculado ao encaminhamento"}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-auto bg-slate-50 p-5">
                {messages.map((item) => (
                  <div
                    key={item.id}
                    className={`max-w-[820px] rounded-md border p-3 ${item.sender_role === "company" ? "ml-auto border-emerald-100 bg-emerald-50" : "border-slate-200 bg-white"}`}
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>
                        {item.sender_role === "company" ? "Empresa" : "SINE"} ·{" "}
                        {item.sender_name ?? "Sistema"}
                      </span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                      {item.body}
                    </div>
                    {item.message_type !== "message" && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-800">
                        <LockKeyhole size={13} /> {item.message_type}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <form
                onSubmit={sendMessage}
                className="border-t border-slate-100 p-4"
              >
                <label className="block text-sm font-medium text-slate-700">
                  Responder
                  <textarea
                    required
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!body.trim()}
                  className="tenant-button mt-3 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  <MessageSquareReply size={16} /> Enviar resposta
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function AuditLgpdPage() {
  const [items, setItems] = useState<DataAccessLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<DataAccessLog[]>("/audit/data-access")
      .then(({ data }) => setItems(data))
      .catch(() => setError("Não foi possível carregar a auditoria LGPD."));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Auditoria LGPD</h1>
          <p className="mt-1 text-sm text-slate-600">
            Acessos a currículos, candidatos e contextos enviados para empresas.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          <LockKeyhole size={17} /> Trilha de acesso
        </div>
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Quem acessou</th>
              <th className="px-4 py-3">Candidato/Currículo</th>
              <th className="px-4 py-3">Finalidade</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(item.created_at)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {item.accessed_by_name ?? "Sistema"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.worker_name ?? "Candidato"}
                  <div className="text-xs text-slate-500">
                    {item.resume_filename ?? "Sem PDF"}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.reason ?? item.action}
                  <div className="text-xs text-slate-500">{item.action}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.ip_address ?? "-"}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  Nenhum acesso auditado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Link
        to="/comunicacao"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
      >
        <MessagesSquare size={16} /> Ver comunicação oficial
      </Link>
    </div>
  );
}
