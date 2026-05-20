type Props = {
  status: string;
};

const styles: Record<string, string> = {
  aberta: "bg-blue-50 text-blue-800 ring-blue-200",
  em_analise: "bg-amber-50 text-amber-800 ring-amber-200",
  aguardando_confirmacao_identidade: "bg-violet-50 text-violet-800 ring-violet-200",
  deferida: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  indeferida: "bg-rose-50 text-rose-800 ring-rose-200",
  concluida: "bg-slate-100 text-slate-800 ring-slate-200",
  cancelada: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export function LgpdStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status] ?? styles.aberta}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
