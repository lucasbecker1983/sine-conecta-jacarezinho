type Policy = {
  id: string;
  entity_type: string;
  retention_days: number;
  action_after_retention: string;
  is_active: boolean;
};

export function RetentionPolicyCard({ policy }: { policy: Policy }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-950">{policy.entity_type}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${policy.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
          {policy.is_active ? "ativa" : "inativa"}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Revisar após {policy.retention_days} dias. Ação prevista: {policy.action_after_retention}.
      </p>
    </article>
  );
}
