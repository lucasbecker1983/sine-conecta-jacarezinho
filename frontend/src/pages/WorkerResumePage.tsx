import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import {
  AppAlert,
  AppButton,
  AppCard,
  AppInput,
  AppPageHeader,
  AppSelect,
  AppTextarea,
} from "../components/ui";

type WorkerProfile = {
  cpf: string;
  full_name: string;
  birth_date: string;
  phone: string;
  whatsapp: string;
  address: string;
  district: string;
  city: string;
  state: string;
  education_level: string;
  desired_role: string;
  desired_salary: string;
  availability: string;
  cnh: string;
  has_disability: boolean | null;
  disability_notes: string;
  notes: string;
  lgpd_accepted: boolean;
};

type UploadedResume = {
  id: string;
  original_filename: string;
  size_bytes: number;
  status: string;
  created_at: string;
  analysis?: {
    summary?: string;
    skills?: string[];
  };
};

type Job = {
  id: string;
  title: string;
  description: string;
  vacancies: number;
  salary_range?: string;
  workplace?: string;
  modality: string;
};

type Application = {
  id: string;
  job_id: string;
  job_title: string;
  status: string;
  created_at: string;
};

const emptyProfile: WorkerProfile = {
  cpf: "",
  full_name: "",
  birth_date: "",
  phone: "",
  whatsapp: "",
  address: "",
  district: "",
  city: "Jacarezinho",
  state: "PR",
  education_level: "",
  desired_role: "",
  desired_salary: "",
  availability: "",
  cnh: "",
  has_disability: null,
  disability_notes: "",
  notes: "",
  lgpd_accepted: false,
};

const fields: Array<[keyof WorkerProfile, string, string]> = [
  ["cpf", "CPF", "text"],
  ["full_name", "Nome completo", "text"],
  ["birth_date", "Data de nascimento", "date"],
  ["phone", "Telefone", "text"],
  ["whatsapp", "WhatsApp", "text"],
  ["education_level", "Escolaridade", "text"],
  ["desired_role", "Profissão pretendida", "text"],
  ["desired_salary", "Pretensão salarial", "text"],
  ["availability", "Disponibilidade de horário", "text"],
  ["cnh", "CNH", "text"],
  ["address", "Endereço", "text"],
  ["district", "Bairro", "text"],
  ["city", "Cidade", "text"],
  ["state", "Estado", "text"],
];

export function WorkerResumePage() {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<WorkerProfile>(emptyProfile);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(
    searchParams.get("vaga") ?? "",
  );
  const [resumes, setResumes] = useState<UploadedResume[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    api
      .get("/worker-portal/profile")
      .then(({ data }) => {
        if (!data) return;
        setProfile({
          ...emptyProfile,
          ...data,
          birth_date: data.birth_date ?? "",
          disability_notes: data.disability_notes ?? "",
          notes: data.notes ?? "",
        });
      })
      .catch(() => undefined);
    loadResumes();
    loadJobs();
  }, []);

  function loadResumes() {
    api
      .get<UploadedResume[]>("/worker-portal/resumes")
      .then(({ data }) => {
        setResumes(data);
        setSelectedResumeId((current) => current || data[0]?.id || "");
      })
      .catch(() => setResumes([]));
  }

  function loadJobs() {
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

  function update(key: keyof WorkerProfile, value: string | boolean | null) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    if (!selectedJobId) {
      setMessage(
        "Selecione uma vaga aberta antes de salvar e enviar seu currículo.",
      );
      setSaving(false);
      return;
    }
    try {
      const payload = { ...profile, birth_date: profile.birth_date || null };
      const { data } = await api.put(
        `/worker-portal/profile?job_id=${selectedJobId}`,
        payload,
      );
      setProfile({
        ...emptyProfile,
        ...data,
        birth_date: data.birth_date ?? "",
        disability_notes: data.disability_notes ?? "",
        notes: data.notes ?? "",
      });
      setMessage("Currículo salvo e candidatura vinculada à vaga selecionada.");
      loadJobs();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail ??
          "Não foi possível salvar seu currículo.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadPdf(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedFile) {
      setUploadMessage("Selecione um arquivo PDF.");
      return;
    }
    if (!selectedJobId) {
      setUploadMessage("Selecione uma vaga aberta antes de enviar o PDF.");
      return;
    }
    setUploading(true);
    setUploadMessage("");
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("job_id", selectedJobId);
      await api.post("/worker-portal/resume-pdf", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null);
      setUploadMessage(
        "PDF enviado, analisado e candidatura vinculada à vaga selecionada.",
      );
      loadResumes();
      loadJobs();
    } catch (error: any) {
      setUploadMessage(
        error?.response?.data?.detail ?? "Não foi possível enviar o PDF.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function confirmApplication() {
    if (!selectedJobId) {
      setMessage("Selecione uma vaga para confirmar a candidatura.");
      return;
    }
    setApplying(true);
    setMessage("");
    try {
      const { data } = await api.post(
        `/worker-portal/jobs/${selectedJobId}/apply`,
        {
          resume_id: selectedResumeId || null,
          confirm_lgpd: true,
        },
      );
      setMessage(
        data.message ??
          "Sua candidatura foi enviada ao SINE. A equipe fará a triagem e, se houver compatibilidade, poderá encaminhar seu perfil à empresa.",
      );
      loadJobs();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail ??
          "Não foi possível confirmar sua candidatura.",
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        eyebrow="Portal do Trabalhador"
        title="Concorrer a uma vaga"
        description="Primeiro selecione a vaga aberta. Depois escolha preencher o currículo no portal ou enviar o PDF."
        action={
        <Link
          to="/vagas"
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Ver vagas abertas no portal público
        </Link>
        }
      />

      <AppAlert tone="info" title="Vaga obrigatória">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <AppSelect
            label="1. Vaga obrigatória"
            value={selectedJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
            required
          >
            {jobs.length === 0 && (
              <option value="">Nenhuma vaga aberta no momento</option>
            )}
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </AppSelect>
          <div className="text-sm leading-6">
            <strong>Fluxo correto:</strong> o currículo só pode ser salvo ou
            enviado em PDF depois que a vaga for selecionada. Assim o SINE
            recebe a candidatura já vinculada à oportunidade desejada.
          </div>
        </div>
      </AppAlert>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <AppCard>
        <form onSubmit={submit}>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-950">
              2A. Preencher currículo no portal
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Use esta opção para manter seus dados atualizados diretamente no
              sistema.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([key, label, type]) => (
              <AppInput
                key={key}
                label={label}
                type={type}
                value={String(profile[key] ?? "")}
                onChange={(event) => update(key, event.target.value)}
                required={key === "cpf" || key === "full_name"}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <AppSelect
              label="Possui deficiência?"
              value={
                profile.has_disability === null
                  ? ""
                  : profile.has_disability
                    ? "sim"
                    : "nao"
              }
              onChange={(event) =>
                update(
                  "has_disability",
                  event.target.value === ""
                    ? null
                    : event.target.value === "sim",
                )
              }
            >
              <option value="">Não informado</option>
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </AppSelect>
            <AppInput
              label="Observações sobre acessibilidade"
              value={profile.disability_notes}
              onChange={(event) =>
                update("disability_notes", event.target.value)
              }
            />
          </div>

          <AppTextarea
            label="Experiências, cursos, habilidades e observações"
            className="mt-4 min-h-32"
            value={profile.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Exemplo: atendimento ao público, informática, operador de caixa, cursos concluídos, experiências anteriores..."
          />

          <label className="mt-4 flex items-start gap-3 rounded-md bg-emerald-50 p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={profile.lgpd_accepted}
              onChange={(event) =>
                update("lgpd_accepted", event.target.checked)
              }
              required
            />
            <span>
              Autorizo o tratamento dos meus dados pelo SINE para cadastro,
              análise de currículo e candidatura a vagas, conforme LGPD.
            </span>
          </label>

          {message && (
            <AppAlert tone="info" className="mt-4">{message}</AppAlert>
          )}

          <div className="mt-5 flex justify-end">
            <AppButton
              type="submit"
              disabled={saving || !selectedJobId}
            >
              {saving ? "Salvando..." : "Salvar e concorrer"}
            </AppButton>
          </div>
        </form>
        </AppCard>

        <aside className="space-y-5">
          <AppCard>
          <form onSubmit={uploadPdf}>
            <h2 className="text-lg font-bold text-slate-950">
              2B. Enviar currículo em PDF
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Envie um arquivo PDF para o SINE analisar. O sistema extrai o
              texto e gera uma sugestão automática para apoiar o atendimento.
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Arquivo PDF
              </span>
              <input
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            {selectedFile && (
              <div className="mt-3 text-sm text-slate-600">
                {selectedFile.name} ·{" "}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
            {uploadMessage && (
              <AppAlert tone="info" className="mt-4">{uploadMessage}</AppAlert>
            )}
            <AppButton
              type="submit"
              className="mt-5 w-full"
              disabled={uploading || !selectedJobId}
            >
              {uploading ? "Enviando..." : "Enviar PDF e concorrer"}
            </AppButton>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              A análise automática é apenas uma sugestão. A decisão final é do
              colaborador responsável.
            </p>
          </form>
          </AppCard>

          <AppCard>
            <h2 className="text-lg font-bold text-slate-950">
              3. Confirmar candidatura
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Depois de atualizar seus dados ou enviar PDF, confirme a
              candidatura para que ela entre na triagem por vaga do SINE.
            </p>
            <AppSelect
              label="Currículo para vincular"
              className="mt-4"
              value={selectedResumeId}
              onChange={(event) => setSelectedResumeId(event.target.value)}
            >
              <option value="">Usar dados preenchidos no portal</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.original_filename}
                </option>
              ))}
            </AppSelect>
            <AppButton
              type="button"
              onClick={confirmApplication}
              disabled={applying || !selectedJobId}
              className="mt-4 w-full"
            >
              {applying ? "Confirmando..." : "Confirmar candidatura"}
            </AppButton>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Sua candidatura será enviada ao SINE. A empresa só recebe seus
              dados se houver encaminhamento oficial.
            </p>
          </AppCard>

          <AppCard>
            <h2 className="text-lg font-bold text-slate-950">
              Minhas candidaturas
            </h2>
            <div className="mt-4 divide-y divide-slate-100">
              {applications.length === 0 && (
                <div className="py-4 text-sm text-slate-500">
                  Nenhuma candidatura registrada ainda.
                </div>
              )}
              {applications.map((application) => (
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
            <h2 className="text-lg font-bold text-slate-950">PDFs enviados</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {resumes.length === 0 && (
                <div className="py-4 text-sm text-slate-500">
                  Nenhum PDF enviado até agora.
                </div>
              )}
              {resumes.map((resume) => (
                <div key={resume.id} className="py-3">
                  <div className="font-semibold text-slate-950">
                    {resume.original_filename}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {friendlyStatus(resume.status)} ·{" "}
                    {(resume.size_bytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                    {new Date(resume.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  {resume.analysis?.summary && (
                    <p className="mt-2 text-sm leading-5 text-slate-600">
                      {resume.analysis.summary}
                    </p>
                  )}
                  {resume.analysis?.skills &&
                    resume.analysis.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {resume.analysis.skills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </AppCard>
        </aside>
      </div>
    </div>
  );
}

function friendlyStatus(status: string) {
  const map: Record<string, string> = {
    candidatura_trabalhador: "Candidatura enviada ao SINE",
    em_analise: "Em análise pelo SINE",
    encaminhado: "Encaminhado para empresa",
    aguardando_retorno_empresa: "Aguardando retorno da empresa",
    encerrado: "Processo encerrado",
    nao_selecionado: "Não selecionado",
    nao_contratado: "Não selecionado",
    contratado: "Contratado",
    banco_talentos: "Banco de talentos",
  };
  return map[status] ?? status;
}
