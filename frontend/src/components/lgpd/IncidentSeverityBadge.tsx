type Props = {
  severity: string;
};

const styles: Record<string, string> = {
  baixa: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  media: "bg-amber-50 text-amber-800 ring-amber-200",
  alta: "bg-orange-50 text-orange-800 ring-orange-200",
  critica: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function IncidentSeverityBadge({ severity }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[severity] ?? styles.media}`}>
      {severity}
    </span>
  );
}
