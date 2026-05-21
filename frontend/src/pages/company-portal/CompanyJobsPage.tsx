import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { api } from "../../services/api";
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppCard,
  AppEmptyState,
  AppInput,
  AppPageHeader,
  AppSelect,
  AppTextarea,
} from "../../components/ui";
import { friendlyStatus } from "../../utils/statusLabels";
import { emptyJob } from "./constants";
import { PortalAlert } from "./PortalAlert";
import { useCompanyPortal } from "./useCompanyPortal";
import type { Job, JobForm } from "./types";

export function CompanyJobsPage() {
  const { jobs, status, error, refresh, setError } = useCompanyPortal();
  const [form, setForm] = useState<JobForm>(emptyJob);
  const [updatingJobId, setUpdatingJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const lockedReason = !status.profile_complete
    ? "Complete o cadastro e aceite os termos da LGPD para solicitar vagas."
    : status.pending_returns > 0
      ? (status.blocking_reason ??
        "Abertura de vagas temporariamente suspensa: registre os retornos finais pendentes antes de abrir uma nova vaga.")
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

  async function updateConfidentiality(job: Job, isConfidential: boolean) {
    setUpdatingJobId(job.id);
    setError("");
    setMessage("");
    try {
      await api.patch<Job>(`/company-portal/jobs/${job.id}`, {
        title: job.title,
        description: job.description,
        vacancies: job.vacancies,
        start_date: job.start_date ?? "",
        closing_deadline: job.closing_deadline ?? "",
        salary_range: job.salary_range ?? "",
        benefits: job.benefits ?? "",
        workday: job.workday ?? "",
        schedule: job.schedule ?? "",
        workplace: job.workplace ?? "",
        modality: job.modality,
        minimum_education: job.minimum_education ?? "",
        required_experience: job.required_experience ?? "",
        desired_courses: job.desired_courses ?? "",
        cnh_required: job.cnh_required ?? "",
        contract_type: job.contract_type ?? "",
        notes: job.notes ?? "",
        travel_required: job.travel_required,
        is_confidential: isConfidential,
      });
      setMessage(
        isConfidential
          ? "Vaga marcada como confidencial para candidatos."
          : "Nome da empresa liberado para candidatos nesta vaga.",
      );
      refresh();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ??
          "Não foi possível atualizar a confidencialidade da vaga.",
      );
    } finally {
      setUpdatingJobId("");
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
                    <strong>{item.job_title}</strong> · {friendlyStatus(item.status)}
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
            <fieldset className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <legend className="px-1 text-sm font-bold text-slate-950">
                Confidencialidade da vaga
              </legend>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Algumas empresas preferem não divulgar o nome da empresa aos
                candidatos. O SINE continuará visualizando todos os dados da
                empresa para análise, encaminhamento e auditoria.
              </p>
              <div className="mt-3 grid gap-2">
                <label className="flex items-start gap-3 rounded-md bg-white p-3 text-sm text-slate-700 ring-1 ring-emerald-100">
                  <input
                    type="radio"
                    name="is_confidential"
                    className="mt-1"
                    checked={!form.is_confidential}
                    onChange={() => setForm({ ...form, is_confidential: false })}
                  />
                  <span>Pode divulgar o nome da empresa aos candidatos</span>
                </label>
                <label className="flex items-start gap-3 rounded-md bg-white p-3 text-sm text-slate-700 ring-1 ring-emerald-100">
                  <input
                    type="radio"
                    name="is_confidential"
                    className="mt-1"
                    checked={form.is_confidential}
                    onChange={() => setForm({ ...form, is_confidential: true })}
                  />
                  <span>Manter empresa confidencial para os candidatos</span>
                </label>
              </div>
            </fieldset>
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
          <h2 className="text-lg font-bold text-slate-950">Histórico de vagas</h2>
          <div className="mt-3 space-y-2">
            {jobs.length === 0 && (
              <AppEmptyState
                title="Nenhuma vaga solicitada ainda"
                message="Quando a empresa enviar a primeira solicitação, ela aparecerá aqui com o acompanhamento do SINE."
              />
            )}
            {jobs.map((job) => (
              <div key={job.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="font-semibold text-slate-950">{job.title}</div>
                  {job.is_confidential ? (
                    <AppBadge tone="warning">Confidencial para candidatos</AppBadge>
                  ) : (
                    <AppBadge tone="success">Nome divulgado</AppBadge>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {friendlyStatus(job.status)} ·{" "}
                  {job.start_date
                    ? new Date(job.start_date).toLocaleDateString("pt-BR")
                    : "início a combinar"}
                </div>
                {!["encerrada", "cancelada"].includes(job.status) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AppButton
                      type="button"
                      variant={job.is_confidential ? "secondary" : "ghost"}
                      disabled={updatingJobId === job.id || job.is_confidential}
                      onClick={() => updateConfidentiality(job, true)}
                    >
                      Tornar confidencial
                    </AppButton>
                    <AppButton
                      type="button"
                      variant={!job.is_confidential ? "secondary" : "ghost"}
                      disabled={updatingJobId === job.id || !job.is_confidential}
                      onClick={() => updateConfidentiality(job, false)}
                    >
                      Divulgar empresa
                    </AppButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </AppCard>
      </div>
    </div>
  );
}
