type Consent = {
  id: string;
  consent_type: string;
  consent_status: string;
  term_title: string;
  term_version: string;
  purpose: string;
  accepted_at?: string | null;
};

export function ConsentVersionCard({ consent }: { consent: Consent }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{consent.term_title}</h3>
          <p className="mt-1 text-sm text-slate-600">{consent.purpose}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          v{consent.term_version}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        <span>{consent.consent_type}</span>
        <span>{consent.consent_status}</span>
        {consent.accepted_at ? <span>{new Date(consent.accepted_at).toLocaleString("pt-BR")}</span> : null}
      </div>
    </article>
  );
}
