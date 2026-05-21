import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  HandHeart,
  Search,
  Send,
  UsersRound,
} from "lucide-react";
import { PublicJobsCanvas } from "../canvas/PublicJobsCanvas";
import { api } from "../services/api";
import type { PublicJob } from "../types";
import sineLogo from "../assets/logos/sine-logo.png";
import { AppBadge, AppEmptyState } from "../components/ui";

type SortMode = "recentes" | "encerramento";

export function PublicJobsPage() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    city: "",
    role: "",
    modality: "",
    education: "",
    salary: false,
  });
  const [sort, setSort] = useState<SortMode>("recentes");

  useEffect(() => {
    api
      .get<PublicJob[]>("/public/jobs")
      .then(({ data }) => setJobs(data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(
    () =>
      Array.from(new Set(jobs.map((job) => job.city).filter(Boolean))).sort(),
    [jobs],
  );

  const visibleJobs = useMemo(() => {
    const search = filters.search.toLowerCase().trim();
    const role = filters.role.toLowerCase().trim();
    const education = filters.education.toLowerCase().trim();
    const filtered = jobs.filter((job) => {
      const searchable = [
        job.title,
        job.description,
        job.required_experience,
        job.desired_courses,
        job.company_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (search && !searchable.includes(search)) return false;
      if (role && !job.title.toLowerCase().includes(role)) return false;
      if (filters.city && job.city !== filters.city) return false;
      if (filters.modality && job.modality !== filters.modality) return false;
      if (
        education &&
        !(job.minimum_education ?? "").toLowerCase().includes(education)
      )
        return false;
      if (filters.salary && !job.salary_range) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "encerramento") {
        return (
          new Date(a.expires_at ?? "2999-12-31").getTime() -
          new Date(b.expires_at ?? "2999-12-31").getTime()
        );
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [filters, jobs, sort]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-14">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-100">
                Portal Público de Vagas
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 lg:text-5xl">
                Encontre oportunidades de trabalho em Jacarezinho e região
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
                Vagas acompanhadas pelo SINE, com orientação, segurança e
                transparência para candidatos e empresas.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/trabalhador/cadastro"
                  className="tenant-button inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                >
                  <Send size={16} /> Sou candidato
                </Link>
                <Link
                  to="/login?role=company"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-emerald-500"
                >
                  Sou empresa
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-4">
                <TrustItem icon={BriefcaseBusiness} label="Atendimento pelo SINE" />
                <TrustItem icon={Building2} label="Empresas parceiras" />
                <TrustItem icon={UsersRound} label="Candidatura segura" />
                <TrustItem icon={HandHeart} label="Dados protegidos" />
              </div>
            </div>
            <div className="relative hidden min-h-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-emerald-50 shadow-sm lg:block">
              <PublicJobsCanvas className="absolute inset-0 h-full w-full opacity-95" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/50" />
              <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/80 bg-white/88 p-4 shadow-lg backdrop-blur">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Vagas publicadas
                </div>
                <div className="mt-1 text-3xl font-black text-slate-950">
                  {jobs.length}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Candidaturas passam pelo acompanhamento do SINE antes do
                  encaminhamento à empresa.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-slate-950">Buscar vagas</h2>
                <p className="text-sm text-slate-500">
                  Filtre por cargo, cidade e perfil da oportunidade.
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-800">
                {visibleJobs.length} resultado(s)
              </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr_0.85fr_0.85fr]">
              <label className="relative">
                <Search
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />
                <input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters({ ...filters, search: event.target.value })
                  }
                  className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-emerald-600"
                  placeholder="Buscar por cargo, habilidade ou empresa"
                />
              </label>
              <select
                value={filters.city}
                onChange={(event) =>
                  setFilters({ ...filters, city: event.target.value })
                }
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="">Todas as cidades</option>
                {cities.map((city) => (
                  <option key={city} value={city ?? ""}>
                    {city}
                  </option>
                ))}
              </select>
              <input
                value={filters.role}
                onChange={(event) =>
                  setFilters({ ...filters, role: event.target.value })
                }
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                placeholder="Cargo"
              />
              <select
                value={filters.modality}
                onChange={(event) =>
                  setFilters({ ...filters, modality: event.target.value })
                }
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="">Modalidade</option>
                <option value="presencial">Presencial</option>
                <option value="hibrido">Híbrido</option>
                <option value="remoto">Remoto</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <input
                value={filters.education}
                onChange={(event) =>
                  setFilters({ ...filters, education: event.target.value })
                }
                className="h-10 min-w-56 rounded-md border border-slate-200 px-3 text-sm"
                placeholder="Escolaridade"
              />
              <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={filters.salary}
                  onChange={(event) =>
                    setFilters({ ...filters, salary: event.target.checked })
                  }
                />
                Com salário informado
              </label>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="recentes">Mais recentes</option>
                <option value="encerramento">Por data de encerramento</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    search: "",
                    city: "",
                    role: "",
                    modality: "",
                    education: "",
                    salary: false,
                  })
                }
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-md border border-slate-200 bg-white"
                />
              ))}
            {!loading &&
              visibleJobs.map((job) => (
                <PublicJobCard key={job.id} job={job} />
              ))}
            {!loading && visibleJobs.length === 0 && (
              <div className="lg:col-span-3">
                <AppEmptyState
                  title="Não encontramos vagas com esses filtros."
                  message="Tente outro cargo ou cidade. Caso precise de ajuda, procure a equipe do SINE Jacarezinho."
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link to="/vagas" className="flex items-center gap-3">
          <img src={sineLogo} alt="SINE" className="h-11 w-auto" />
          <div>
            <div className="font-bold text-slate-950">
              SINE Conecta Jacarezinho
            </div>
            <div className="text-xs text-slate-500">
              Oportunidades com atendimento público
            </div>
          </div>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/login"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400"
          >
            Entrar
          </Link>
          <Link
            to="/login?role=company"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400"
          >
            Sou empresa
          </Link>
          <Link
            to="/trabalhador/cadastro"
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Sou candidato
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/88 p-4 shadow-lg shadow-emerald-950/10 backdrop-blur-md">
      <Icon className="text-emerald-700" size={20} />
      <div className="mt-3 text-2xl font-bold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  label,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
      <Icon size={16} className="text-emerald-700" />
      <span>{label}</span>
    </div>
  );
}

function PublicJobCard({ job }: { job: PublicJob }) {
  return (
    <article className="premium-card-hover flex min-h-64 flex-col rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400">
      <div className="flex flex-wrap gap-2">
        <AppBadge tone="success">Publicada</AppBadge>
        <AppBadge tone="info">{job.modality || "Presencial"}</AppBadge>
        {job.is_confidential && (
          <AppBadge tone="warning">Empresa confidencial</AppBadge>
        )}
        {job.salary_range && (
          <AppBadge tone="warning">Salário informado</AppBadge>
        )}
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-950">{job.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
        {job.description}
      </p>
      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        <span>
          {job.company_name} · {job.city ?? "Jacarezinho"} / {job.state ?? "PR"}
        </span>
        <span>{job.vacancies} vaga(s)</span>
        <span>{job.salary_range ?? "Salário a combinar"}</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <CalendarDays size={14} />
          {job.expires_at
            ? `Até ${new Date(job.expires_at).toLocaleDateString("pt-BR")}`
            : "Prazo a definir"}
        </span>
        <Link
          to={`/vagas/${job.id}`}
          className="rounded-md border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}
