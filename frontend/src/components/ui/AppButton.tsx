import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
};

const variants = {
  primary: "bg-[var(--tenant-primary)] text-white shadow-sm hover:brightness-95 focus-visible:ring-[var(--tenant-primary)]",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50 focus-visible:ring-emerald-600",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500",
  danger: "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 focus-visible:ring-rose-500",
};

export function AppButton({
  children,
  variant = "primary",
  icon,
  className = "",
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
