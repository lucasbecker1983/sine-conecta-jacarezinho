import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Sparkles,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";
import { api } from "../services/api";
import type { Company, Job, Summary } from "../types";
import { CandidateMatchCanvas } from "../canvas/CandidateMatchCanvas";
import { ResumeInsightCanvas } from "../canvas/ResumeInsightCanvas";
import { useAuthStore } from "../stores/auth";
import { CompanyDashboard } from "./CompanyDashboard";
import { AppStatusTimeline } from "../components/ui";
import { OnboardingChecklist } from "../components/onboarding/OnboardingChecklist";
import { friendlyStatus } from "../utils/statusLabels";

const operationalCards: Array<[string, string, LucideIcon]> = [
  ["vagas_solicitadas", "Novas solicitações de vagas", BriefcaseBusiness],
  ["vagas_em_analise", "Empresas aguardando aprovação", Building2],
  ["curriculos_pendentes", "Candidatos pendentes de análise", FileText],
  ["candidatos_cadastrados", "Currículos recebidos", ClipboardList],
  ["vagas_ativas", "Vagas em triagem", UserRoundSearch],
  ["encaminhamentos_mes", "Encaminhamentos aguardando retorno", MessageSquare],
  [
    "empresas_aguardando_retorno",
    "Empresas bloqueadas por feedback",
    AlertTriangle,
  ],
  ["contratacoes_informadas", "Tarefas concluídas no mês", CheckCircle2],
];

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<Summary>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workerJobs, setWorkerJobs] = useState<Job[]>([]);
  const [workerApplications, setWorkerApplications] = useState<
    Array<{ id: string; job_title: string; status: string; created_at: string }>
  >([]);
  const [workerResumes, setWorkerResumes] = useState<
    Array<{ id: string; original_filename: string; created_at: string }>
  >([]);
  const [workerProfile, setWorkerProfile] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [selected, setSelected] = useState("Clique em um candidato no mapa");
  const [selectedAiJobId, setSelectedAiJobId] = useState("");
  const roles = user?.roles ?? [];
  const isCompany = roles.includes("company_user");
  const isWorker = roles.includes("worker");

  useEffect(() => {
    if (isCompany || isWorker) return;
    Promise.all([
      api.get<Summary>("/reports/summary"),
      api.get<Company[]>("/companies"),
      api.get<Job[]>("/jobs"),
    ])
      .then(([report, companyList, jobList]) => {
        setSummary(report.data);
        setCompanies(companyList.data);
        setJobs(jobList.data);
        setSelectedAiJobId((current) => current || jobList.data[0]?.id || "");
      })
      .catch(() => {
        setSummary({});
        setCompanies([]);
        setJobs([]);
      });
  }, [isCompany, isWorker]);

  useEffect(() => {
    if (!isWorker) return;
    Promise.all([
      api.get<Job[]>("/worker-portal/open-jobs"),
      api.get<
        Array<{
          id: string;
          job_title: string;
          status: string;
          created_at: string;
        }>
      >("/worker-portal/applications"),
      api.get<
        Array<{ id: string; original_filename: string; created_at: string }>
      >("/worker-portal/resumes"),
      api.get<Record<string, unknown> | null>("/worker-portal/profile"),
    ])
      .then(([jobList, applicationList, resumeList, profile]) => {
        setWorkerJobs(jobList.data);
        setWorkerApplications(applicationList.data);
        setWorkerResumes(resumeList.data);
        setWorkerProfile(profile.data);
      })
      .catch(() => {
        setWorkerJobs([]);
        setWorkerApplications([]);
        setWorkerResumes([]);
        setWorkerProfile(null);
      });
  }, [isWorker]);

  if (isCompany) {
    return <CompanyDashboard />;
  }

  if (isWorker) {
    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="max-w-4xl">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Portal do Trabalhador
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Olá, {user?.full_name?.split(" ")[0] || "trabalhador"}. Vamos acompanhar suas oportunidades?
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Atualize seus dados, escolha uma vaga e acompanhe os
                encaminhamentos feitos pelo SINE.
              </p>
          </div>
        </section>
        <OnboardingChecklist role="worker" />
        <div className="grid gap-3 md:grid-cols-5">
          <Link
            to="/vagas-abertas"
            className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400"
          >
            <div className="text-sm font-semibold text-emerald-700">
              Minhas candidaturas
            </div>
            <div className="mt-3 text-sm text-slate-600">
              {workerApplications.length} candidatura(s) em acompanhamento.
            </div>
          </Link>
          <Link
            to="/meu-curriculo"
            className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400"
          >
            <div className="text-sm font-semibold text-emerald-700">
              Currículo
            </div>
            <div className="mt-3 text-sm text-slate-600">
              {workerResumes.length > 0
                ? `${workerResumes.length} currículo(s) enviado(s).`
                : "Envie um currículo em PDF legível."}
            </div>
          </Link>
          <Link
            to="/vagas"
            className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400"
          >
            <div className="text-sm font-semibold text-emerald-700">
              Ver vagas abertas
            </div>
            <div className="mt-3 text-sm text-slate-600">
              {workerJobs.length} oportunidade(s) publicadas para candidatura.
            </div>
          </Link>
          <Link
            to="/trabalhador/privacidade"
            className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400"
          >
            <div className="text-sm font-semibold text-emerald-700">
              Privacidade e meus dados
            </div>
            <div className="mt-3 text-sm text-slate-600">
              Veja consentimentos e empresas que receberam seus dados.
            </div>
          </Link>
          <Link
            to="/vagas-abertas"
            className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400"
          >
            <div className="text-sm font-semibold text-emerald-700">
              Encaminhamentos
            </div>
            <div className="mt-3 text-sm text-slate-600">
              Acompanhe quando o SINE enviar seu perfil a uma empresa.
            </div>
          </Link>
        </div>
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-950">Minhas candidaturas</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {workerApplications.length === 0 && (
                <div className="py-4 text-sm text-slate-500">
                  Você ainda não se candidatou. Veja as vagas abertas e escolha
                  uma oportunidade para começar.
                </div>
              )}
              {workerApplications.slice(0, 5).map((application) => (
                <div key={application.id} className="py-3">
                  <div className="font-semibold text-slate-950">
                    {application.job_title}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {friendlyStatus(application.status)} ·{" "}
                    {new Date(application.created_at).toLocaleDateString(
                      "pt-BR",
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-md border border-emerald-100 bg-white p-5">
            <h2 className="font-bold text-slate-950">Orientações do SINE</h2>
            <AppStatusTimeline
              className="mt-4"
              items={[
                { title: "Candidatura enviada ao SINE", description: "Recebemos seu interesse na vaga.", status: "done" },
                { title: "Em análise pelo SINE", description: "A equipe organiza seu currículo e dados.", status: "current" },
                { title: "Encaminhado para empresa", description: "A empresa só recebe seus dados após encaminhamento oficial." },
                { title: "Aguardando retorno da empresa", description: "O SINE acompanha o resultado do processo." },
              ]}
            />
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <p>
                Mantenha telefone, WhatsApp e cidade atualizados para a equipe
                conseguir falar com você.
              </p>
              <p>
                Dados faltantes:{" "}
                <strong>
                  {missingWorkerFields(workerProfile).length ||
                    "nenhum item essencial"}
                </strong>
              </p>
              <p>
                A empresa só vê seus dados quando o SINE faz um encaminhamento
                oficial.
              </p>
            </div>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="max-w-4xl">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              Operação SINE
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              Painel operacional do SINE
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Organize vagas, candidaturas, triagens, encaminhamentos e
              retornos das empresas em um só lugar.
            </p>
        </div>
      </section>
      <OnboardingChecklist role={roles.includes("sine_manager") ? "sine_manager" : "sine_staff"} />
      <div className="grid gap-3 md:grid-cols-4">
        {operationalCards.map(([key, label, Icon]) => {
          const route = [
            "vagas_solicitadas",
            "curriculos_pendentes",
            "vagas_ativas",
          ].includes(String(key))
            ? "/sine/triagem"
            : undefined;
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm text-slate-500">{String(label)}</div>
                <Icon className="text-emerald-700" size={18} />
              </div>
              <div className="mt-2 text-3xl font-bold text-slate-950">
                {summary[String(key)] ?? 0}
              </div>
            </>
          );
          return route ? (
            <Link
              key={String(key)}
              to={route}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400"
            >
              {content}
            </Link>
          ) : (
            <div
              key={String(key)}
              className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            >
              {content}
            </div>
          );
        })}
      </div>
      <section className="rounded-md border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
              <Bot size={15} /> Assistente IA do SINE
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-950">
              Apoio inteligente para triagem, sem substituir o colaborador
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              A IA pode resumir currículo, extrair habilidades, comparar
              currículo com vaga, sugerir candidatos compatíveis, explicar
              aderência, sugerir perguntas para entrevista e apontar dados
              faltantes no cadastro.
            </p>
            <p className="mt-2 text-sm font-semibold text-amber-800">
              A IA é apenas apoio à triagem. A decisão final é do colaborador do
              SINE.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <select
              value={selectedAiJobId}
              onChange={(event) => setSelectedAiJobId(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {jobs.length === 0 && (
                <option value="">Nenhuma vaga disponível</option>
              )}
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <Link
              to={
                selectedAiJobId
                  ? `/sine/triagem/${selectedAiJobId}`
                  : "/sine/triagem"
              }
              className="tenant-button inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
            >
              <Sparkles size={17} /> Abrir triagem por vaga
            </Link>
          </div>
        </div>
      </section>
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950">
              Fila de Trabalho do SINE
            </h2>
            <p className="text-sm text-slate-600">
              Prioridades do dia para manter vagas, currículos e retornos em
              movimento.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Atualizada pelo painel operacional
          </span>
        </div>
        <div className="space-y-2">
          {[
            [
              "Alta",
              "Feedback pendente",
              `${summary.empresas_aguardando_retorno ?? 0} empresa(s) precisam retornar feedback antes de novas vagas.`,
              "/encaminhamentos",
            ],
            [
              "Alta",
              "Novas vagas",
              `${summary.vagas_solicitadas ?? 0} solicitação(ões) aguardam análise do SINE.`,
              "/sine/triagem",
            ],
            [
              "Média",
              "Currículos e candidaturas",
              `${summary.curriculos_pendentes ?? 0} currículo(s) ou candidatura(s) aguardam triagem.`,
              "/sine/triagem",
            ],
            [
              "Média",
              "Mensagens novas",
              "Verificar conversas abertas com empresas e registrar encaminhamentos.",
              "/comunicacao",
            ],
            [
              "Baixa",
              "Solicitações LGPD",
              "Verificar pedidos de titulares e possíveis incidentes de privacidade.",
              "/lgpd",
            ],
          ].map(([priority, type, title, to]) => (
            <div
              key={`${priority}-${type}`}
              className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 md:grid-cols-[90px_160px_1fr_auto] md:items-center"
            >
              <span
                className={`rounded-full px-2 py-1 text-center text-xs font-bold ${priority === "Alta" ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}
              >
                {priority}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {type}
              </span>
              <span className="text-sm text-slate-600">{title}</span>
              <Link
                to={to}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:border-emerald-400"
              >
                {to === "/sine/triagem" ? "Triar candidatos" : "Abrir"}
              </Link>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-md border border-emerald-100 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950">
              Empresas cadastradas e disponíveis ao SINE
            </h2>
            <p className="text-sm text-slate-600">
              Cadastros feitos pelo portal da empresa ou criados pelos
              colaboradores aparecem na mesma fila operacional.
            </p>
          </div>
          <Link
            to="/empresas"
            className="tenant-button rounded-md px-3 py-2 text-sm font-semibold"
          >
            Gerir empresas
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {companies.slice(0, 3).map((company) => (
            <div
              key={company.id}
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <div className="font-semibold text-slate-950">
                {company.trade_name || company.legal_name}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {company.cnpj} · {company.city ?? "Região"} /{" "}
                {company.state ?? "PR"}
              </div>
              <div className="mt-3 text-xs font-semibold text-emerald-800">
                {company.lgpd_accepted ? "LGPD aceita" : "LGPD pendente"}
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 md:col-span-3">
              Nenhuma empresa cadastrada ainda.
            </div>
          )}
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-950">
              Compatibilidade candidato/vaga
            </h2>
            <span className="text-sm text-slate-500">{selected}</span>
          </div>
          <CandidateMatchCanvas
            onSelect={(candidate) =>
              setSelected(`${candidate.name} · ${candidate.score}%`)
            }
          />
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-bold text-slate-950">
            Leitura visual do currículo
          </h2>
          <ResumeInsightCanvas />
        </section>
      </div>
    </div>
  );
}

function missingWorkerFields(profile: Record<string, unknown> | null) {
  if (!profile) return ["cadastro"];
  return [
    "phone",
    "whatsapp",
    "city",
    "education_level",
    "desired_role",
  ].filter((field) => !profile[field]);
}
