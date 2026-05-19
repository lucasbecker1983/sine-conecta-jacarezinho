import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, UserRoundPlus } from "lucide-react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";
import type { Tenant, User } from "../types";

type RegisterResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  tenant: Tenant | null;
  job_id?: string | null;
  message: string;
};

const lgpdText =
  "Declaro que li e aceito o tratamento dos meus dados pessoais pelo SINE Conecta Jacarezinho para fins de intermediação de mão de obra, candidatura a vagas e contato pela equipe do SINE.";

export function WorkerRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const jobId = searchParams.get("jobId");
  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    birth_date: "",
    phone: "",
    whatsapp: "",
    email: "",
    city: "Jacarezinho",
    state: "PR",
    password: "",
    confirm_password: "",
    education_level: "",
    desired_role: "",
    cnh: "",
    availability: "",
    notes: "",
    lgpd_accepted: false,
  });
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    api
      .get<{ title: string }>(`/public/jobs/${jobId}`)
      .then(({ data }) => setJobTitle(data.title))
      .catch(() => setJobTitle(""));
  }, [jobId]);

  function update(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        birth_date: form.birth_date || null,
        job_id: jobId,
      };
      const { data } = await api.post<RegisterResponse>(
        "/public/workers/register",
        payload,
      );
      localStorage.setItem("sine_access_token", data.access_token);
      localStorage.setItem("sine_refresh_token", data.refresh_token);
      setSession(data.user, data.tenant);
      navigate(data.job_id ? `/meu-curriculo?vaga=${data.job_id}` : "/");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ??
          "Não foi possível concluir seu cadastro agora.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link
            to={jobId ? `/vagas/${jobId}` : "/vagas"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>
          <Link
            to={
              jobId
                ? `/login?role=worker&redirect=/meu-curriculo?vaga=${jobId}`
                : "/login?role=worker"
            }
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-emerald-400"
          >
            Já tenho cadastro
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <section className="rounded-md border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <UserRoundPlus size={15} /> Cadastro do trabalhador
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-950">
            Crie seu acesso para se candidatar
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {jobTitle
              ? `Você está se cadastrando para continuar a candidatura na vaga ${jobTitle}.`
              : "Informe seus dados para acompanhar vagas e candidaturas pelo Portal do Trabalhador."}
          </p>
        </section>

        <form
          onSubmit={submit}
          className="mt-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nome completo"
              value={form.full_name}
              onChange={(value) => update("full_name", value)}
              required
            />
            <TextField
              label="CPF"
              value={form.cpf}
              onChange={(value) => update("cpf", value)}
              required
            />
            <TextField
              label="Data de nascimento"
              type="date"
              value={form.birth_date}
              onChange={(value) => update("birth_date", value)}
            />
            <TextField
              label="Telefone"
              value={form.phone}
              onChange={(value) => update("phone", value)}
              required
            />
            <TextField
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(value) => update("whatsapp", value)}
              required
            />
            <TextField
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(value) => update("email", value)}
              required
            />
            <TextField
              label="Cidade"
              value={form.city}
              onChange={(value) => update("city", value)}
              required
            />
            <TextField
              label="Estado"
              value={form.state}
              onChange={(value) => update("state", value)}
              required
            />
            <TextField
              label="Senha"
              type="password"
              value={form.password}
              onChange={(value) => update("password", value)}
              required
            />
            <TextField
              label="Confirmação de senha"
              type="password"
              value={form.confirm_password}
              onChange={(value) => update("confirm_password", value)}
              required
            />
            <TextField
              label="Escolaridade"
              value={form.education_level}
              onChange={(value) => update("education_level", value)}
            />
            <TextField
              label="Profissão pretendida"
              value={form.desired_role}
              onChange={(value) => update("desired_role", value)}
            />
            <TextField
              label="CNH"
              value={form.cnh}
              onChange={(value) => update("cnh", value)}
            />
            <TextField
              label="Disponibilidade"
              value={form.availability}
              onChange={(value) => update("availability", value)}
            />
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Observações
            </span>
            <textarea
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
              placeholder="Cursos, experiências, habilidades, horários disponíveis..."
            />
          </label>
          <label className="mt-4 flex items-start gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.lgpd_accepted}
              onChange={(event) =>
                update("lgpd_accepted", event.target.checked)
              }
              required
            />
            <span>
              <ShieldCheck size={16} className="mr-1 inline" />
              {lgpdText}
              <span className="mt-2 block text-emerald-900">
                Seus dados serão analisados pelo SINE. A empresa só receberá
                seus dados quando houver encaminhamento oficial.
              </span>
            </span>
          </label>
          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <button
              disabled={loading}
              className="tenant-button rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-70"
            >
              {loading ? "Criando cadastro..." : "Criar cadastro e continuar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
      />
    </label>
  );
}
