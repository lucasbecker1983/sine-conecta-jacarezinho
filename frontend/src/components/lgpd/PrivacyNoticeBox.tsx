import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  variant?: "worker" | "company" | "triage" | "default";
  children?: ReactNode;
};

const messages = {
  worker:
    "Seu currículo poderá ser analisado por ferramenta de apoio interno do SINE para auxiliar a triagem. A empresa só receberá seus dados se houver encaminhamento oficial.",
  company:
    "A empresa não acessa a análise interna de IA. Ela recebe apenas candidatos encaminhados oficialmente pelo SINE.",
  triage:
    "A IA é usada exclusivamente como apoio interno do SINE para organizar informações de currículos e sugerir compatibilidade. Ela não decide contratação, não elimina candidatos automaticamente e a decisão final é humana.",
  default:
    "Seus dados são tratados com controle de acesso, auditoria e finalidade vinculada à intermediação pública de emprego.",
};

export function PrivacyNoticeBox({ variant = "default", children }: Props) {
  return (
    <div className="flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p>{children ?? messages[variant]}</p>
    </div>
  );
}
