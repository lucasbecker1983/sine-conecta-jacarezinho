import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareReply } from "lucide-react";
import { api } from "../../services/api";
import { LgpdNotice } from "../../components/lgpd/LgpdNotice";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppEmptyState,
  AppInput,
  AppMetricCard,
  AppPageHeader,
  AppSelect,
} from "../../components/ui";
import { friendlyStatus, StatusBadge } from "../../utils/statusLabels";
import { finalFeedbackOptions } from "./constants";
import { PortalAlert } from "./PortalAlert";
import { useCompanyPortal } from "./useCompanyPortal";

const pendingStatuses = [
  "encaminhado",
  "entrevista_agendada",
  "entrevistado",
  "aguardando_retorno",
  "aguardando_retorno_empresa",
];

export function CompanyReferralsPage() {
  const { referrals, error, refresh, setError } = useCompanyPortal();
  const [feedback, setFeedback] = useState<
    Record<string, { status: string; comments: string }>
  >({});
  const [message, setMessage] = useState("");
  const pendingCount = referrals.filter((referral) =>
    pendingStatuses.includes(referral.status),
  ).length;

  async function sendFeedback(referralId: string) {
    const item = feedback[referralId] ?? {
      status: "contratado",
      comments: "",
    };
    setError("");
    setMessage("");
    try {
      await api.post(`/company-portal/referrals/${referralId}/feedback`, item);
      setMessage(
        `Retorno final registrado como "${friendlyStatus(item.status)}". O SINE já recebeu a informação e acompanhará os próximos passos pelo portal.`,
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
        description="Avalie os candidatos encaminhados pelo SINE e registre um retorno final para manter o atendimento em dia."
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
      <LgpdNotice compact />
      <PortalAlert message={message} error={error} />
      <AppCard>
        <div className="grid gap-3 lg:grid-cols-2">
          {referrals.map((referral) => {
            const current = feedback[referral.id] ?? {
              status: "contratado",
              comments: "",
            };
            const isPending = pendingStatuses.includes(referral.status);
            return (
              <article
                key={referral.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-950">{referral.worker_name}</div>
                    <div className="mt-1 text-sm text-slate-600">{referral.job_title}</div>
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
                {isPending ? (
                  <>
                    <div className="mt-4 grid gap-2 md:grid-cols-[220px_1fr]">
                      <AppSelect
                        label="Retorno final"
                        value={current.status}
                        onChange={(e) =>
                          setFeedback({
                            ...feedback,
                            [referral.id]: { ...current, status: e.target.value },
                          })
                        }
                      >
                        {finalFeedbackOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
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
                        placeholder="Ex.: entrevista realizada, perfil aprovado, vaga preenchida..."
                      />
                    </div>
                    <AppButton
                      type="button"
                      onClick={() => sendFeedback(referral.id)}
                      className="mt-3"
                      icon={<MessageSquareReply size={16} />}
                    >
                      Registrar retorno final
                    </AppButton>
                  </>
                ) : (
                  <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm text-slate-600">
                    Retorno já registrado como {friendlyStatus(referral.status)}.
                    Acompanhe sua candidatura pelo portal.
                  </p>
                )}
              </article>
            );
          })}
          {referrals.length === 0 && (
            <div className="lg:col-span-2">
              <AppEmptyState
                title="Nenhum candidato encaminhado ainda"
                message="Quando o SINE encaminhar currículos para uma vaga da empresa, eles aparecerão aqui para avaliação."
              />
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
}
