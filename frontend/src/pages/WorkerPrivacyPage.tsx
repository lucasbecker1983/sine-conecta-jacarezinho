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

export function WorkerPrivacyPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [sharing, setSharing] = useState<DataSharingRecord[]>([]);
  const [requests, setRequests] = useState<Array<{ id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/lgpd/me/consents"),
      api.get("/lgpd/me/data-sharing"),
      api.get("/lgpd/me/requests"),
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
  if (error) return <ErrorState message="Não foi possível carregar seus dados de privacidade agora." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-emerald-700">Privacidade e meus dados</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Seus consentimentos e compartilhamentos</h1>
      </div>
      <PrivacyNoticeBox variant="worker" />
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">Consentimentos aceitos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {consents.length ? consents.map((consent) => <ConsentVersionCard key={consent.id} consent={consent} />) : <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">Ainda não há consentimentos registrados.</p>}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">Empresas que receberam seus dados</h2>
        <DataSharingTable records={sharing} />
      </section>
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-950">Solicitações LGPD</h2>
            <p className="mt-1 text-sm text-slate-600">{requests.length} solicitação(ões) registradas.</p>
          </div>
          <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" to="/privacidade/solicitacao">
            Abrir solicitação
          </Link>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          A revogação pode impedir novos encaminhamentos, mas não remove registros necessários para cumprimento de obrigações legais, auditoria e histórico operacional.
        </p>
      </section>
    </div>
  );
}
