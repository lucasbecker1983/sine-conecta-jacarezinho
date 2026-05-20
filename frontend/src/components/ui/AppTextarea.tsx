import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function AppTextarea({ label, hint, id, className = "", ...props }: Props) {
  const textareaId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={textareaId}>
      {label}
      <textarea
        id={textareaId}
        className={`mt-1 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
