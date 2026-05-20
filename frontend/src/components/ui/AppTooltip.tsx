import type { ReactNode } from "react";

export function AppTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-xs -translate-x-1/2 rounded-lg bg-slate-950 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
        {label}
      </span>
    </span>
  );
}
