import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function AppPageHeader({ eyebrow, title, description, action, children }: Props) {
  return (
    <header className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          {eyebrow ? <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">{eyebrow}</p> : null}
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {action}
      </div>
      {children ? <div className="border-t border-emerald-100 bg-emerald-50/40 p-4">{children}</div> : null}
    </header>
  );
}
