import { useEffect, useState } from "react";
import { ServerCog } from "lucide-react";
import { api } from "../services/api";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";

type SystemStatus = {
  status: string;
  app: string;
  environment: string;
  database: string;
  uploads_dir: string;
  version: string;
  uptime: string;
  timestamp: string;
};

export function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<SystemStatus>("/admin/system/status")
      .then(({ data }) => setStatus(data))
      .catch(() => setError("Não foi possível carregar o status do sistema."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!status) return <EmptyState />;

  const items = [
    ["API", status.status],
    ["Banco", status.database],
    ["Uploads", status.uploads_dir],
    ["Ambiente", status.environment],
    ["Versão", status.version],
    ["Uptime", status.uptime],
    ["Horário do servidor", new Date(status.timestamp).toLocaleString("pt-BR")],
  ];

  return (
    <div className="space-y-5">
      <header className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <ServerCog size={18} />
          Status interno
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{status.app}</h1>
      </header>
      <section className="grid gap-3 md:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
            <div className="mt-2 text-sm font-bold text-slate-950">{value}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
