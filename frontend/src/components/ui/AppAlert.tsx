import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "success" | "error" | "warning" | "info";

const config = {
  success: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-950" },
  error: { icon: AlertCircle, className: "border-rose-200 bg-rose-50 text-rose-950" },
  warning: { icon: TriangleAlert, className: "border-amber-200 bg-amber-50 text-amber-950" },
  info: { icon: Info, className: "border-sky-200 bg-sky-50 text-sky-950" },
};

export function AppAlert({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = config[tone].icon;
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm ${config[tone].className} ${className}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        {title ? <div className="font-bold">{title}</div> : null}
        <div className={title ? "mt-1 leading-6" : "leading-6"}>{children}</div>
      </div>
    </div>
  );
}
