import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
};

export function AppSelect({ label, hint, id, children, className = "", ...props }: Props) {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={selectId}>
      {label}
      <select
        id={selectId}
        className={`mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
