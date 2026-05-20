import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function AppEmptyState({ title = "Ainda não há dados para exibir.", message, action }: { title?: string; message?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
      <h2 className="mt-3 font-semibold text-slate-950">{title}</h2>
      {message ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
