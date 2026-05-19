import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";
import type { User } from "../types";

export function ProfilePage() {
  const { user, setSession, tenant } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(user);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<User>("/profile/me")
      .then(({ data }) => {
        setProfile(data);
        setFullName(data.full_name);
      })
      .catch(() => undefined);
  }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch<User>("/profile/me", {
        full_name: fullName,
      });
      setProfile(data);
      setSession(data, tenant);
      setMessage("Perfil atualizado com sucesso.");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Não foi possível atualizar o perfil.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Meu perfil</h1>
        <p className="mt-1 text-sm text-slate-600">
          Dados da conta, segurança e identificação usada nos registros de
          auditoria.
        </p>
      </div>
      {(message || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
        >
          {error || message}
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          onSubmit={saveProfile}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >
          <UserRound className="text-emerald-700" size={24} />
          <h2 className="mt-3 text-lg font-bold text-slate-950">
            Dados da conta
          </h2>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Nome completo
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            E-mail
            <input
              disabled
              value={profile?.email ?? ""}
              className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
            />
          </label>
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            <ShieldCheck size={16} className="mr-1 inline text-emerald-700" />{" "}
            Perfil ativo: {profile?.roles.join(", ")}
          </div>
          <button className="tenant-button mt-4 rounded-md px-4 py-2 text-sm font-semibold">
            Salvar perfil
          </button>
        </form>
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <KeyRound className="text-emerald-700" size={24} />
          <h2 className="mt-3 text-lg font-bold text-slate-950">Segurança</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            A troca de senha exige a senha atual, confirmação e uma senha forte.
            Nenhuma senha é exibida ou gravada em texto puro.
          </p>
          <Link
            to="/alterar-senha"
            className="tenant-button mt-4 inline-flex rounded-md px-4 py-2 text-sm font-semibold"
          >
            Alterar senha
          </Link>
        </section>
      </div>
    </div>
  );
}
