import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interactive?: boolean;
};

export function AppCard({ children, interactive = false, className = "", ...props }: Props) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${interactive ? "transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
