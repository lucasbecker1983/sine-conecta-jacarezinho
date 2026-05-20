import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function AppInput({ label, hint, error, id, className = "", ...props }: Props) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...props}
      />
      {hint && !error ? <span id={`${inputId}-hint`} className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span id={`${inputId}-error`} className="mt-1 block text-xs text-rose-700">{error}</span> : null}
    </label>
  );
}
