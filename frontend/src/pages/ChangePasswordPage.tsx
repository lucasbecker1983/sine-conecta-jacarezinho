import { FormEvent, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { api } from "../services/api";

export function ChangePasswordPage() {
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (passwords.new_password !== passwords.confirm_password) {
      setError("A confirmação da nova senha não confere.");
      return;
    }
    try {
      await api.post("/profile/change-password", passwords);
      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setMessage("Senha alterada com segurança.");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ?? "Não foi possível alterar a senha.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Alterar senha</h1>
        <p className="mt-1 text-sm text-slate-600">
          Proteja sua conta com uma senha forte e exclusiva.
        </p>
      </div>
      {(message || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
        >
          {error || message}
        </div>
      )}
      <form
        onSubmit={changePassword}
        className="max-w-2xl rounded-md border border-slate-200 bg-white p-5 shadow-sm"
      >
        <KeyRound className="text-emerald-700" size={24} />
        <h2 className="mt-3 text-lg font-bold text-slate-950">
          Credenciais de acesso
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          A senha deve ter pelo menos 10 caracteres e combinar letras, números
          ou símbolos.
        </p>
        <div className="mt-4 grid gap-3">
          <input
            required
            type="password"
            placeholder="Senha atual"
            value={passwords.current_password}
            onChange={(e) =>
              setPasswords({ ...passwords, current_password: e.target.value })
            }
            className="rounded-md border border-slate-200 px-3 py-2"
          />
          <input
            required
            type="password"
            placeholder="Nova senha"
            value={passwords.new_password}
            onChange={(e) =>
              setPasswords({ ...passwords, new_password: e.target.value })
            }
            className="rounded-md border border-slate-200 px-3 py-2"
          />
          <input
            required
            type="password"
            placeholder="Confirmar nova senha"
            value={passwords.confirm_password}
            onChange={(e) =>
              setPasswords({ ...passwords, confirm_password: e.target.value })
            }
            className="rounded-md border border-slate-200 px-3 py-2"
          />
        </div>
        <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-950">
          <ShieldCheck size={16} className="mr-1 inline" /> A alteração é
          registrada em auditoria e o hash permanece protegido em Argon2id.
        </div>
        <button className="tenant-button mt-4 rounded-md px-4 py-2 text-sm font-semibold">
          Alterar senha
        </button>
      </form>
    </div>
  );
}
