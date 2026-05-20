import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { AppAlert, AppStepper } from "../components/ui";

export function LgpdRequestPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setMessage(null);
    try {
      await api.post("/lgpd/public/requests", {
        requester_name: form.get("requester_name"),
        requester_email: form.get("requester_email"),
        requester_document: form.get("requester_document") || null,
        requester_type: form.get("requester_type"),
        request_type: form.get("request_type"),
        description: form.get("description"),
        confirmation: form.get("confirmation") === "on",
      });
      event.currentTarget.reset();
      setMessage("Solicitação registrada. O SINE poderá pedir confirmação de identidade antes de responder.");
    } catch {
      setError("Não foi possível registrar a solicitação agora. Revise os campos obrigatórios.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Link className="text-sm font-semibold text-emerald-700" to="/privacidade/direitos">
          Voltar para direitos do titular
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">Solicitação LGPD</h1>
        <p className="mt-2 text-slate-600">Use este canal para solicitar acesso, correção, revogação, informação de compartilhamento ou outra demanda sobre seus dados.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-md border border-slate-200 bg-white p-5">
          <AppStepper
            current={0}
            steps={[
              { title: "Identificação", description: "Informe como o SINE pode encontrar seu atendimento." },
              { title: "Pedido", description: "Escolha o direito que deseja exercer." },
              { title: "Confirmação", description: "A identidade poderá ser validada antes da resposta." },
            ]}
          />
          <label className="block text-sm font-medium text-slate-700">
            Nome
            <input required name="requester_name" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            E-mail
            <input required type="email" name="requester_email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            CPF/CNPJ opcional
            <input name="requester_document" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Tipo de solicitante
              <select name="requester_type" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="worker">Trabalhador</option>
                <option value="company_user">Empresa</option>
                <option value="public">Outro</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tipo de solicitação
              <select name="request_type" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="access_data">Acesso aos dados</option>
                <option value="correct_data">Correção de dados</option>
                <option value="revoke_consent">Revogar consentimento</option>
                <option value="delete_data">Exclusão quando cabível</option>
                <option value="information_sharing">Informação sobre compartilhamento</option>
                <option value="other">Outra solicitação</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Descrição
            <textarea required minLength={10} name="description" rows={5} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="flex gap-3 text-sm text-slate-700">
            <input required type="checkbox" name="confirmation" className="mt-1" />
            <span>Declaro que as informações fornecidas são verdadeiras e estou ciente de que o SINE poderá solicitar confirmação de identidade antes de responder.</span>
          </label>
          {message ? <AppAlert tone="success">{message}</AppAlert> : null}
          {error ? <AppAlert tone="error">{error}</AppAlert> : null}
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" type="submit">
            Enviar solicitação
          </button>
        </form>
      </section>
    </main>
  );
}
