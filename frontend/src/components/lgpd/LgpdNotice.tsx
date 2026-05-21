import { ShieldCheck } from "lucide-react";
import { AppAlert } from "../ui";

type Props = {
  className?: string;
  compact?: boolean;
};

export function LgpdNotice({ className = "", compact = false }: Props) {
  return (
    <AppAlert
      tone="info"
      title={compact ? "Proteção de dados" : "LGPD e encaminhamento oficial"}
      className={className}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-emerald-700"
          aria-hidden="true"
        />
        <p className="text-sm leading-6 text-slate-700">
          A empresa só recebe os dados do candidato se o SINE fizer o
          encaminhamento oficial. Até lá, o cadastro e o currículo ficam sob
          cuidado do SINE Conecta Jacarezinho.
        </p>
      </div>
    </AppAlert>
  );
}
