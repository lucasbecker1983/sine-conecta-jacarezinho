import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentTenant, login } from "../services/api";
import { useAuthStore } from "../stores/auth";
import { applyTenantTheme } from "../white-label/theme";
import { Logo } from "../components/Logo";
import { LoginNetworkCanvas } from "../canvas/LoginNetworkCanvas";
import { AppAlert, AppButton } from "../components/ui";
import { defaultTenantTheme } from "../white-label/tenantTheme";

type AccessProfile = "company" | "worker" | "staff";

const profiles = {
  company: {
    icon: Building2,
    title: "Sou empresa",
    eyebrow: "Portal da Empresa",
    description:
      "Solicite vagas, acompanhe candidatos encaminhados e registre retornos.",
    email: "empresa@sine.jacarezinho.cloud",
  },
  worker: {
    icon: UserRound,
    title: "Sou candidato",
    eyebrow: "Portal do Candidato",
    description:
      "Atualize seu cadastro, envie currículo e acompanhe encaminhamentos.",
    email: "candidato@sine.jacarezinho.cloud",
  },
  staff: {
    icon: BriefcaseBusiness,
    title: "Sou colaborador do SINE",
    eyebrow: "Painel do SINE",
    description:
      "Gerencie empresas, candidatos, vagas, currículos e relatórios.",
    email: "colaborador@sine.jacarezinho.cloud",
  },
};

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const initialProfile = (
    searchParams.get("role") === "company"
      ? "company"
      : searchParams.get("role") === "worker"
        ? "worker"
        : "staff"
  ) as AccessProfile;
  const [selectedProfile, setSelectedProfile] =
    useState<AccessProfile>(initialProfile);
  const [email, setEmail] = useState(profiles[initialProfile].email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selected = profiles[selectedProfile];

  useEffect(() => {
    getCurrentTenant()
      .then(applyTenantTheme)
      .catch(() => undefined);
  }, []);

  function chooseProfile(profile: AccessProfile) {
    setSelectedProfile(profile);
    setEmail(profiles[profile].email);
    setPassword("");
    setError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      setSession(data.user, data.tenant);
      navigate(searchParams.get("redirect") || "/");
    } catch {
      setError("Não foi possível entrar com essas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page min-h-screen bg-[#f4f7f5] px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:h-screen lg:overflow-hidden">
      <div className="login-shell mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] lg:h-[calc(100vh-32px)] lg:min-h-0">
        <div className="grid min-h-0 flex-1 lg:grid-cols-[0.96fr_1.04fr]">
          <section className="login-hero relative min-h-[360px] overflow-hidden bg-emerald-950 p-6 text-white sm:p-8 lg:min-h-0 xl:p-10">
            <LoginNetworkCanvas />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,44,34,0.14),rgba(2,44,34,0.72))]" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-emerald-950 to-transparent" />
            <div className="login-hero-content relative z-10 flex h-full min-h-[330px] flex-col justify-between lg:min-h-0">
              <div>
                <div className="inline-flex rounded-xl bg-white p-2 shadow-lg ring-1 ring-white/80 sm:p-2.5">
                  <Logo className="login-logo h-12 w-44 object-contain sm:h-16 sm:w-56" />
                </div>
                <div className="login-intro mt-8 max-w-xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-emerald-50 ring-1 ring-white/20">
                    <ShieldCheck size={16} />
                    Portal oficial com LGPD e auditoria
                  </div>
                  <h1 className="text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl">
                    {defaultTenantTheme.visibleName}
                  </h1>
                  <p className="login-copy mt-5 max-w-lg text-base leading-7 text-emerald-50/88">
                    {defaultTenantTheme.tagline}
                  </p>
                </div>
              </div>
              <div className="login-badges grid gap-2 text-sm text-emerald-50/90 sm:grid-cols-3">
                <HeroBadge title="SINE" text="triagem humana" />
                <HeroBadge title="Empresas" text="candidatos encaminhados" />
                <HeroBadge title="Candidatos" text="dados protegidos" />
              </div>
            </div>
          </section>

          <section className="login-panel flex min-h-0 flex-col justify-center overflow-hidden bg-white p-5 sm:p-7 lg:p-8 xl:p-10">
            <div className="login-heading mb-5 max-w-xl">
              <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Escolha seu acesso
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Entrar na plataforma
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Acesso restrito para usuários cadastrados.
              </p>
            </div>

            <div className="login-profile-grid mb-5 grid gap-2">
              {(
                Object.entries(profiles) as Array<
                  [AccessProfile, (typeof profiles)[AccessProfile]]
                >
              ).map(([key, profile]) => {
                const Icon = profile.icon;
                const active = selectedProfile === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => chooseProfile(key)}
                    aria-pressed={active}
                    className={`login-profile-card flex min-h-[72px] items-center gap-3 rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${active ? "border-emerald-700 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"}`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${active ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      <Icon size={23} />
                    </span>
                    <span>
                      <span className="block text-base font-bold text-slate-950">
                        {profile.title}
                      </span>
                      <span className="login-profile-description mt-1 block text-sm leading-5 text-slate-600">
                        {profile.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={submit}
              className="login-form max-w-xl rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-emerald-700">
                    {selected.eyebrow}
                  </div>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">
                    {selected.title}
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Voltar para colaborador"
                  className="rounded-md p-2 text-slate-500 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  onClick={() => chooseProfile("staff")}
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  E-mail
                </span>
                <span className="flex items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-emerald-700">
                  <Mail size={18} className="text-slate-400" />
                  <input
                    className="h-11 w-full border-0 bg-transparent px-3 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                  />
                </span>
              </label>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Senha
                </span>
                <span className="flex items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-emerald-700">
                  <LockKeyhole size={18} className="text-slate-400" />
                  <input
                    className="h-11 w-full border-0 bg-transparent px-3 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                  />
                </span>
              </label>
              {error && <AppAlert tone="error" title={error} className="mb-4" />}
              <AppButton
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </AppButton>
              {selectedProfile !== "staff" && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    to={
                      selectedProfile === "worker"
                        ? "/trabalhador/cadastro"
                        : "/login?role=company"
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  >
                    Primeiro acesso
                  </Link>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  >
                    Recuperar senha
                  </button>
                </div>
              )}
              <div className="mt-4 grid gap-2 text-center text-sm sm:grid-cols-2">
                <Link
                  to="/vagas"
                  className="font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  Ver vagas abertas
                </Link>
                <Link
                  to="/trabalhador/cadastro"
                  className="font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  Sou candidato e quero me cadastrar
                </Link>
                <Link
                  to="/login?role=company"
                  onClick={() => chooseProfile("company")}
                  className="font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  Sou empresa e quero solicitar vagas
                </Link>
                <Link
                  to="/privacidade/direitos"
                  className="font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  Privacidade e LGPD
                </Link>
              </div>
              <p className="login-lgpd mt-4 text-xs leading-5 text-slate-500">
                Ambiente seguro para empresas, candidatos e equipe do SINE.
                Dados pessoais são tratados conforme LGPD e auditados por
                finalidade de atendimento público.
              </p>
            </form>
          </section>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-400 sm:px-8">
          <span>Prefeitura Municipal de Jacarezinho</span>
          <span className="inline-flex items-center gap-2 opacity-70">
            <span className="flex h-5 w-8 items-center justify-center rounded-sm border border-slate-300 text-[10px] font-black tracking-tight text-slate-500">
              JMB
            </span>
            <span className="font-medium">Tecnologia</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

function HeroBadge({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/18 bg-white/12 p-4 shadow-lg shadow-emerald-950/15 backdrop-blur-md">
      <div className="text-lg font-black text-white">{title}</div>
      <div className="mt-1 text-xs leading-5 text-emerald-50/85">{text}</div>
    </div>
  );
}
