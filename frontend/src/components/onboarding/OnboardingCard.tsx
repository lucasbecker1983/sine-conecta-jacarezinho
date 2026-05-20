import type { ReactNode } from "react";

export function OnboardingCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
    </article>
  );
}
