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
import { EmptyState } from "../components/common/EmptyState";

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
        <section className="relative overflow-hidden border-b border-emerald-100 bg-emerald-50">
          <PublicJobsCanvas className="absolute inset-0 h-full w-full opacity-80" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
            <div>
              <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-emerald-900 shadow-sm">
                Portal Público de Vagas
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-slate-950 lg:text-5xl">
                Encontre oportunidades de trabalho em Jacarezinho e região
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
                Vagas encaminhadas com apoio do SINE, conectando trabalhadores e
                empresas com segurança, transparência e cuidado.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/trabalhador/cadastro"
                  className="tenant-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
                >
                  <Send size={16} /> Sou trabalhador
                </Link>
                <Link
                  to="/login?role=company"
                  className="rounded-md border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                >
                  Sou empresa
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <HeroMetric
                icon={BriefcaseBusiness}
                label="Vagas abertas"
                value={jobs.length}
              />
              <HeroMetric
                icon={Building2}
                label="Empresas parceiras"
                value="SINE"
              />
              <HeroMetric
                icon={UsersRound}
                label="Candidaturas em andamento"
                value="com triagem"
              />
              <HeroMetric
                icon={HandHeart}
                label="Atendimento humanizado pelo SINE"
                value="LGPD"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
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
                className="h-11 rounded-md border border-slate-200 px-3 text-sm"
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
                className="h-11 rounded-md border border-slate-200 px-3 text-sm"
                placeholder="Cargo"
              />
              <select
                value={filters.modality}
                onChange={(event) =>
                  setFilters({ ...filters, modality: event.target.value })
                }
                className="h-11 rounded-md border border-slate-200 px-3 text-sm"
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
                <EmptyState message="Ainda não há vagas para exibir com esses filtros." />
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
            Sou trabalhador
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
    <div className="rounded-md border border-white/80 bg-white/85 p-4 shadow-sm">
      <Icon className="text-emerald-700" size={20} />
      <div className="mt-3 text-2xl font-bold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}

function PublicJobCard({ job }: { job: PublicJob }) {
  return (
    <article className="flex min-h-64 flex-col rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
          {job.modality}
        </span>
        {job.salary_range && (
          <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
            Salário informado
          </span>
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
