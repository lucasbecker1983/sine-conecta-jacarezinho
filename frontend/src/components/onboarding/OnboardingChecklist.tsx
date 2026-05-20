import { useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

const checklistByRole: Record<string, string[]> = {
  company_user: [
    "Complete os dados da empresa",
    "Aceite os termos LGPD",
    "Solicite sua primeira vaga",
    "Aguarde análise do SINE",
    "Informe retorno dos candidatos",
  ],
  worker: [
    "Complete seu cadastro",
    "Envie currículo",
    "Veja vagas abertas",
    "Candidate-se",
    "Acompanhe status",
  ],
  sine_staff: [
    "Revise novas vagas",
    "Publique vagas",
    "Analise candidaturas",
    "Use a triagem por vaga",
    "Encaminhe candidatos",
    "Acompanhe retornos",
    "Verifique LGPD",
  ],
  sine_manager: [
    "Revise novas vagas",
    "Acompanhe indicadores",
    "Analise solicitações LGPD",
    "Monitore retornos das empresas",
  ],
};

function storageKey(role: string) {
  return `onboardingDismissedByRole:${role}`;
}

export function OnboardingChecklist({ role }: { role: string }) {
  const items = useMemo(() => checklistByRole[role] ?? checklistByRole.sine_staff, [role]);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey(role)) === "true");

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(storageKey(role), "true");
    setDismissed(true);
  }

  return (
    <section className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-950">Primeiros passos</h2>
          <p className="mt-1 text-sm text-slate-600">Um guia rápido para aproveitar o SINE Conecta com segurança.</p>
        </div>
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={dismiss} aria-label="Dispensar onboarding">
          <X size={18} />
        </button>
      </div>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
            <CheckCircle2 size={16} className="text-emerald-700" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
