import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  MapPin,
  Send,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";
import type { PublicJob } from "../types";

export function PublicJobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    api
      .get<PublicJob>(`/public/jobs/${jobId}`)
      .then(({ data }) => setJob(data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [jobId]);

  function apply() {
    if (!jobId) return;
    if (localStorage.getItem("sine_access_token")) {
      navigate(`/meu-curriculo?vaga=${jobId}`);
      return;
    }
    navigate(`/trabalhador/cadastro?jobId=${jobId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-md bg-white" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 px-5 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-950">
          Vaga não encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ela pode ter sido encerrada ou retirada da publicação.
        </p>
        <Link
          to="/vagas"
          className="mt-5 inline-flex rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900"
        >
          Ver vagas abertas
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            to="/vagas"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft size={16} /> Voltar para vagas
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-emerald-400"
          >
            Entrar
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          <div className="rounded-md border border-emerald-100 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              Vaga publicada pelo SINE
            </span>
            {job.is_confidential && (
              <span className="ml-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                Empresa confidencial
              </span>
            )}
            <h1 className="mt-4 text-3xl font-bold text-slate-950">
              {job.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {job.company_name} · {job.city ?? "Jacarezinho"} /{" "}
              {job.state ?? "PR"}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetailPill
                icon={BriefcaseBusiness}
                label="Vagas"
                value={`${job.vacancies}`}
              />
              <DetailPill
                icon={MapPin}
                label="Modalidade"
                value={job.modality}
              />
              <DetailPill
                icon={GraduationCap}
                label="Escolaridade"
                value={job.minimum_education ?? "Não informada"}
              />
              <DetailPill
                icon={CalendarDays}
                label="Prazo"
                value={
                  job.expires_at
                    ? new Date(job.expires_at).toLocaleDateString("pt-BR")
                    : "A definir"
                }
              />
            </div>
          </div>

          <InfoSection title="Descrição da vaga">{job.description}</InfoSection>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoSection title="Salário/faixa">
              {job.salary_range ?? "A combinar"}
            </InfoSection>
            <InfoSection title="Jornada">
              {job.workday || job.schedule || "Não informada"}
            </InfoSection>
            <InfoSection title="Experiência">
              {job.required_experience ?? "Não informada"}
            </InfoSection>
            <InfoSection title="Cursos desejados">
              {job.desired_courses ?? "Não informado"}
            </InfoSection>
            <InfoSection title="CNH">
              {job.cnh_required ?? "Não informada"}
            </InfoSection>
            <InfoSection title="Benefícios">
              {job.benefits ?? "Não informado"}
            </InfoSection>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="sticky top-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <button
              onClick={apply}
              className="tenant-button inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold"
            >
              <Send size={17} /> Quero me candidatar
            </button>
            <div className="mt-4 rounded-md bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
              <ShieldCheck size={17} className="mr-1 inline" />
              Seus dados serão utilizados pela equipe do SINE para análise de
              compatibilidade com vagas, contato sobre oportunidades e possível
              encaminhamento para empresas parceiras. A empresa só receberá seus
              dados quando houver encaminhamento oficial pelo SINE.
            </div>
            <div className="mt-4 text-sm leading-6 text-slate-600">
              Após a candidatura, a equipe do SINE fará a triagem. A IA é apenas
              apoio interno do SINE e não decide por você.
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function DetailPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <Icon className="text-emerald-700" size={18} />
      <div className="mt-2 text-xs font-bold uppercase text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
        {children}
      </p>
    </section>
  );
}
