import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ConsentVersionCard } from "../components/lgpd/ConsentVersionCard";
import { DataSharingTable } from "../components/lgpd/DataSharingTable";
import type { DataSharingRecord } from "../components/lgpd/DataSharingTable";
import { PrivacyNoticeBox } from "../components/lgpd/PrivacyNoticeBox";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { api } from "../services/api";

type Consent = {
  id: string;
  consent_type: string;
  consent_status: string;
  term_title: string;
  term_version: string;
  purpose: string;
  accepted_at?: string | null;
};

export function CompanyPrivacyPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [sharing, setSharing] = useState<DataSharingRecord[]>([]);
  const [requests, setRequests] = useState<Array<{ id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/lgpd/company/consents"),
      api.get("/lgpd/company/data-sharing"),
      api.get("/lgpd/company/requests"),
    ])
      .then(([consentsResponse, sharingResponse, requestsResponse]) => {
        setConsents(consentsResponse.data);
        setSharing(sharingResponse.data);
        setRequests(requestsResponse.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Carregando informações de privacidade..." />;
  if (error) return <ErrorState message="Não foi possível carregar os dados LGPD da empresa." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-emerald-700">Privacidade e dados</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Dados recebidos por encaminhamento oficial</h1>
      </div>
      <PrivacyNoticeBox variant="company" />
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Os dados dos candidatos são compartilhados exclusivamente para avaliação da vaga correspondente e não devem ser usados para outras finalidades.
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">Termos aceitos pela empresa</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {consents.length ? consents.map((consent) => <ConsentVersionCard key={consent.id} consent={consent} />) : <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">Ainda não há termos versionados registrados.</p>}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">Compartilhamentos recebidos</h2>
        <DataSharingTable records={sharing} />
      </section>
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{requests.length} solicitação(ões) LGPD da empresa.</p>
          <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" to="/privacidade/solicitacao">
            Abrir solicitação
          </Link>
        </div>
      </section>
    </div>
  );
}
