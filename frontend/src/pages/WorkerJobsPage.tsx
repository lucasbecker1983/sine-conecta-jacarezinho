import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { LgpdNotice } from "../components/lgpd/LgpdNotice";
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppCard,
  AppEmptyState,
  AppInput,
  AppPageHeader,
  AppSelect,
  AppStepper,
} from "../components/ui";
import { friendlyStatus } from "../utils/statusLabels";

type Job = {
  id: string;
  title: string;
  description: string;
  vacancies: number;
  salary_range?: string;
  workplace?: string;
  modality: string;
  minimum_education?: string;
  status: string;
  is_confidential: boolean;
  company_name: string;
  city?: string | null;
  state?: string | null;
};

type Application = {
  id: string;
  job_id: string;
  job_title: string;
  status: string;
  created_at: string;
};

export function WorkerJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const filteredJobs = jobs.filter((job) =>
    [job.title, job.description, job.workplace, job.modality, job.minimum_education]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const selected = jobs.find((job) => job.id === selectedJobId);

  function load() {
    api
      .get<Job[]>("/worker-portal/open-jobs")
      .then(({ data }) => {
        setJobs(data);
        setSelectedJobId((current) =>
          data.some((job) => job.id === current) ? current : "",
        );
      })
      .catch(() => setJobs([]));
    api
      .get<Application[]>("/worker-portal/applications")
      .then(({ data }) => setApplications(data))
      .catch(() => setApplications([]));
  }

  useEffect(() => {
    load();
  }, []);

  function continueToResume() {
    setMessage("");
    if (!selected) {
      setMessage("Escolha uma vaga antes de continuar para o currículo.");
      return;
    }
    navigate(`/meu-curriculo?vaga=${selected.id}`);
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Portal do Candidato"
        title="Vagas abertas"
        description="Escolha uma vaga disponível. Depois preencha ou envie seu currículo para concluir a candidatura."
      />
      <LgpdNotice compact />
      <AppStepper
        current={selectedJobId ? 1 : 0}
        steps={[
          "Escolha uma vaga aberta",
          "Preencha ou envie seu currículo",
          "Acompanhe sua candidatura",
          "Aguarde orientações do SINE",
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <AppCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-950">Escolha uma vaga</h2>
              <p className="mt-1 text-sm text-slate-600">
                Esta é sua vitrine de oportunidades. Toque em uma vaga e siga
                para o currículo.
              </p>
            </div>
            <AppBadge tone="info">{filteredJobs.length} vaga(s)</AppBadge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.9fr]">
            <AppInput
              label="Buscar vaga"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cargo, local, modalidade ou requisito"
            />
            <AppSelect
              label="Vaga selecionada"
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
            >
              <option value="">Selecione uma vaga</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </AppSelect>
          </div>
          <div className="mt-4 space-y-3">
            {jobs.length === 0 && (
              <AppEmptyState
                title="Nenhuma vaga aberta no momento"
                message="Assim que o SINE publicar novas oportunidades, elas aparecerão aqui para candidatura."
              />
            )}
            {jobs.length > 0 && filteredJobs.length === 0 && (
              <AppEmptyState
                title="Nenhuma vaga encontrada"
                message="Tente buscar por outro cargo, local, modalidade ou requisito."
              />
            )}
            {filteredJobs.map((job) => {
              const active = job.id === selectedJobId;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full rounded-xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                    active
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-slate-950">
                        {job.title}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <AppBadge tone="success">{job.vacancies} vaga(s)</AppBadge>
                      <AppBadge tone={active ? "success" : "neutral"}>
                        {active ? "Selecionada" : friendlyStatus(job.status)}
                      </AppBadge>
                      {job.is_confidential ? (
                        <AppBadge tone="warning">Empresa confidencial</AppBadge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <span>Empresa: {job.company_name}</span>
                    <span>Cargo: {job.title}</span>
                    <span>
                      Local: {job.workplace || job.city || "Não informado"}
                    </span>
                    <span>Modalidade: {friendlyStatus(job.modality)}</span>
                    <span>Salário: {job.salary_range || "A combinar"}</span>
                    <span>
                      Escolaridade: {job.minimum_education || "Não informado"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {message && (
            <AppAlert tone="info" className="mt-4">{message}</AppAlert>
          )}
          <AppButton
            className="mt-5 w-full"
            onClick={continueToResume}
          >
            Quero me candidatar
          </AppButton>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            A empresa só recebe seus dados se o SINE fizer o encaminhamento
            oficial. Acompanhe sua candidatura pelo portal.
          </p>
        </AppCard>

        <AppCard>
          <h2 className="font-bold text-slate-950">Minhas candidaturas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Aqui você acompanha o status do encaminhamento e próximas
            orientações do SINE.
          </p>
          <div className="mt-4 divide-y divide-slate-100">
            {applications.length === 0 && (
              <div className="py-3">
                <AppEmptyState message="Você ainda não se candidatou a nenhuma vaga." />
              </div>
            )}
            {applications.map((application) => (
              <div key={application.id} className="py-3">
                <div className="font-semibold text-slate-950">
                  {application.job_title}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {friendlyStatus(application.status)} ·{" "}
                  {new Date(application.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      </div>
    </div>
  );
}
