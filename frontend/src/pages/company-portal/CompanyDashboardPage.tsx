import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  MessageSquareReply,
  ShieldCheck,
  UserRoundSearch,
} from "lucide-react";
import sineLogoFullHd from "../../assets/logos/sine-logo-fullhd.png";
import { LgpdNotice } from "../../components/lgpd/LgpdNotice";
import { OnboardingChecklist } from "../../components/onboarding/OnboardingChecklist";
import {
  AppAlert,
  AppBadge,
  AppCard,
  AppErrorState,
  AppLoadingState,
  AppMetricCard,
  AppPageHeader,
} from "../../components/ui";
import { friendlyStatus } from "../../utils/statusLabels";
import { useCompanyPortal } from "./useCompanyPortal";

export function CompanyDashboard() {
  const { jobs, referrals, status, loading, error } = useCompanyPortal();
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
            "Para manter o atendimento organizado, novas vagas ficam pausadas até a empresa registrar os retornos finais.",
        };

  if (loading) return <AppLoadingState message="Carregando área da empresa..." />;
  if (error) return <AppErrorState message={error} />;

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Portal da Empresa"
        title="Bem-vindo ao SINE Conecta Jacarezinho"
        description="Solicite vagas, acompanhe candidatos encaminhados e mantenha o retorno em dia para fortalecer a empregabilidade local."
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
          A empresa vê apenas candidatos encaminhados oficialmente. A IA é
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
          <AppMetricCard label="Retornos pendentes" value={status.pending_returns} />
        </div>
      </AppPageHeader>

      <LgpdNotice />
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
            body: "Veja candidatos enviados pelo SINE e registre o retorno.",
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
                <div className="mt-3 font-bold text-slate-950">{item.title}</div>
                <p className="mt-1 text-sm text-slate-600">{item.body}</p>
              </AppCard>
            </Link>
          );
        })}
      </div>

      {!status.can_open_job && status.pending_returns > 0 && (
        <AppAlert tone="warning" title="Precisamos do seu retorno para continuar o fluxo">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="max-w-3xl text-sm leading-6 text-amber-900">
              {status.blocking_reason ??
                "Para mantermos o processo justo com os candidatos e eficiente para sua empresa, informe o resultado final dos encaminhamentos antes de abrir uma nova solicitação."}
            </p>
            <Link
              to="/empresa/encaminhamentos"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
            >
              Informar retorno agora
            </Link>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(status.pending_feedbacks ?? []).map((item) => (
              <div
                key={item.referral_id}
                className="rounded-md border border-amber-200 bg-white p-3 text-sm"
              >
                <div className="font-semibold text-slate-950">{item.worker_name}</div>
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
            {latestJobs.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma vaga solicitada ainda.</p>
            )}
            {latestJobs.map((job) => (
              <div key={job.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="font-semibold text-slate-950">{job.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {friendlyStatus(job.status)}
                </div>
              </div>
            ))}
          </div>
        </AppCard>
        <AppCard>
          <h2 className="text-lg font-bold text-slate-950">Últimos encaminhamentos</h2>
          <div className="mt-3 space-y-2">
            {latestReferrals.length === 0 && (
              <p className="text-sm text-slate-500">
                Ainda não há candidatos encaminhados.
              </p>
            )}
            {latestReferrals.map((referral) => (
              <div
                key={referral.id}
                className="rounded-md border border-slate-100 bg-slate-50 p-3"
              >
                <div className="font-semibold text-slate-950">{referral.worker_name}</div>
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
