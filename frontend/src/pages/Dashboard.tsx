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
import {
  AppBadge,
  AppCard,
  AppEmptyState,
  AppMetricCard,
  AppPageHeader,
  AppSelect,
  AppStatusTimeline,
} from "../components/ui";
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
        <AppPageHeader
          eyebrow="Portal do Candidato"
          title={`Olá, ${user?.full_name?.split(" ")[0] || "candidato"}. Esta é sua trajetória.`}
          description="Acompanhe currículo, vagas de interesse e próximos passos com uma linguagem simples."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <AppMetricCard label="Vagas abertas" value={workerJobs.length} />
            <AppMetricCard
              label="Candidaturas"
              value={workerApplications.length}
            />
            <AppMetricCard
              label="Currículos enviados"
              value={workerResumes.length}
            />
          </div>
        </AppPageHeader>
        <OnboardingChecklist role="worker" />
        <div className="grid gap-3 md:grid-cols-5">
          {[
            {
              to: "/vagas-abertas",
              title: "Minhas candidaturas",
              body: `${workerApplications.length} candidatura(s) em acompanhamento.`,
            },
            {
              to: "/meu-curriculo",
              title: "Currículo",
              body:
                workerResumes.length > 0
                  ? `${workerResumes.length} currículo(s) enviado(s).`
                  : "Envie um currículo em PDF legível.",
            },
            {
              to: "/vagas",
              title: "Ver vagas abertas",
              body: `${workerJobs.length} oportunidade(s) publicadas para candidatura.`,
            },
            {
              to: "/trabalhador/privacidade",
              title: "Privacidade e meus dados",
              body: "Veja consentimentos e empresas que receberam seus dados.",
            },
            {
              to: "/vagas-abertas",
              title: "Encaminhamentos",
              body: "Acompanhe quando o SINE enviar seu perfil a uma empresa.",
            },
          ].map((item) => (
            <Link
              key={`${item.to}-${item.title}`}
              to={item.to}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <AppCard interactive className="h-full">
                <div className="text-sm font-semibold text-emerald-700">
                  {item.title}
                </div>
                <div className="mt-3 text-sm text-slate-600">{item.body}</div>
              </AppCard>
            </Link>
          ))}
        </div>
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <AppCard>
            <h2 className="font-bold text-slate-950">Minhas candidaturas</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {workerApplications.length === 0 && (
                <AppEmptyState
                  title="Você ainda não se candidatou"
                  message="Veja as vagas abertas e escolha uma oportunidade para começar sua trajetória com o SINE."
                />
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
          </AppCard>
          <AppCard>
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
          </AppCard>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Operação SINE"
        title="Central operacional do SINE"
        description="Priorize análises, triagens, encaminhamentos e retornos das empresas em um só lugar."
      >
        <AppStatusTimeline
          items={[
            {
              title: "Receber currículos e candidaturas",
              description: "Organizar dados enviados pelos candidatos.",
              status: "done",
            },
            {
              title: "Analisar compatibilidade",
              description: "Usar critérios do SINE com apoio opcional da IA.",
              status: "current",
            },
            {
              title: "Encaminhar para empresas",
              description: "Compartilhar dados apenas por encaminhamento oficial.",
            },
            {
              title: "Cobrar retorno obrigatório",
              description: "Manter empresas regulares antes de novas vagas.",
            },
          ]}
        />
      </AppPageHeader>
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
            <AppMetricCard
              label={String(label)}
              value={summary[String(key)] ?? 0}
              icon={Icon}
            />
          );
          return route ? (
            <Link
              key={String(key)}
              to={route}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              {content}
            </Link>
          ) : (
            <div key={String(key)}>{content}</div>
          );
        })}
      </div>
      <AppCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <AppBadge tone="success">
              <Bot size={15} /> Assistente IA do SINE
            </AppBadge>
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
            <AppSelect
              label="Vaga para triagem"
              value={selectedAiJobId}
              onChange={(event) => setSelectedAiJobId(event.target.value)}
            >
              {jobs.length === 0 && (
                <option value="">Nenhuma vaga disponível</option>
              )}
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </AppSelect>
            <Link
              to={
                selectedAiJobId
                  ? `/sine/triagem/${selectedAiJobId}`
                  : "/sine/triagem"
              }
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tenant-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tenant-primary)] focus-visible:ring-offset-2"
            >
              <Sparkles size={17} /> Abrir triagem por vaga
            </Link>
          </div>
        </div>
      </AppCard>
      <AppCard>
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
          <AppBadge tone="success">Atualizada pelo painel operacional</AppBadge>
        </div>
        <div className="space-y-2">
          {[
            [
              "Alta",
              "Retorno pendente",
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                {to === "/sine/triagem" ? "Triar candidatos" : "Abrir"}
              </Link>
            </div>
          ))}
        </div>
      </AppCard>
      <AppCard>
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
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--tenant-primary)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tenant-primary)] focus-visible:ring-offset-2"
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
      </AppCard>
      <div className="grid gap-5 xl:grid-cols-2">
        <AppCard>
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
        </AppCard>
        <AppCard>
          <h2 className="mb-3 font-bold text-slate-950">
            Leitura visual do currículo
          </h2>
          <ResumeInsightCanvas />
        </AppCard>
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
