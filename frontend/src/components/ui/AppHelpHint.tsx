import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";

export function AppHelpHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
