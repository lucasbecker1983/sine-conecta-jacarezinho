import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AppMetricCard({ label, value, icon: Icon, hint }: { label: string; value: ReactNode; icon?: LucideIcon; hint?: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon ? <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" /> : null}
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}
