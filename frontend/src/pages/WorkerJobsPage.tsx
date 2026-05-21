import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppCard,
  AppEmptyState,
  AppInput,
  AppPageHeader,
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
        setSelectedJobId((current) => current || data[0]?.id || "");
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
    if (!selectedJobId) return;
    navigate(`/meu-curriculo?vaga=${selectedJobId}`);
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Portal do Trabalhador"
        title="Vagas abertas"
        description="Escolha uma vaga disponível. Depois envie ou preencha seu currículo para concluir a candidatura."
      />
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
                Toque em uma oportunidade e siga para o currículo.
              </p>
            </div>
            <AppBadge tone="info">{filteredJobs.length} vaga(s)</AppBadge>
          </div>
          <AppInput
            label="Buscar vaga"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cargo, local, modalidade ou requisito"
            className="mt-4"
          />
          <div className="mt-4 space-y-3">
            {filteredJobs.length === 0 && (
              <AppEmptyState
                title="Nenhuma vaga encontrada"
                message="Tente buscar por outro cargo, local ou requisito."
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
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                      {job.vacancies} vaga(s)
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <span>Local: {job.workplace || "Não informado"}</span>
                    <span>Modalidade: {friendlyStatus(job.modality)}</span>
                    <span>Salário: {job.salary_range || "A combinar"}</span>
                    <span>
                      Requisito: {job.minimum_education || "Não informado"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {message && (
            <AppAlert tone="success" className="mt-4">{message}</AppAlert>
          )}
          <AppButton
            className="mt-5 w-full"
            disabled={!selectedJobId}
            onClick={continueToResume}
          >
            Tenho interesse
          </AppButton>
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
