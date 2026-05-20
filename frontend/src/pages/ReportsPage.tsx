import { useEffect, useMemo, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { AppMetricCard } from "../components/ui";

type Summary = Record<string, number>;

const labels: Record<string, string> = {
  vagas_solicitadas: "Vagas solicitadas",
  vagas_em_analise: "Vagas em análise",
  vagas_ativas: "Vagas ativas",
  candidatos_cadastrados: "Candidatos cadastrados",
  curriculos_pendentes: "Currículos pendentes",
  encaminhamentos_mes: "Encaminhamentos",
  contratacoes_informadas: "Contratações informadas",
  empresas_aguardando_retorno: "Empresas aguardando retorno",
  taxa_retorno_empresas: "Taxa de retorno",
  tempo_medio_fechamento_dias: "Tempo médio de fechamento",
};

export function ReportsPage() {
  const roles = useAuthStore((state) => state.user?.roles ?? []);
  const canExport = roles.some((role) => ["super_admin", "tenant_admin", "sine_manager"].includes(role));
  const [summary, setSummary] = useState<Summary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Summary>("/reports/overview")
      .then(({ data }) => setSummary(data))
      .catch(() => setError("Não foi possível carregar os relatórios agora."))
      .finally(() => setLoading(false));
  }, []);

  const cards = useMemo(() => Object.entries(summary), [summary]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (cards.length === 0) return <EmptyState />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <FileBarChart size={18} />
            Relatórios internos
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Indicadores do SINE</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Use os indicadores para acompanhar a intermediação de mão de obra,
            identificar gargalos e apoiar decisões da gestão pública.
          </p>
        </div>
        {canExport && (
          <a
            className="tenant-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
            href="/api/reports/export.csv"
          >
            <Download size={16} />
            Exportar CSV
          </a>
        )}
      </header>
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950">Filtros</h2>
            <p className="mt-1 text-sm text-slate-600">
              Visão consolidada do tenant atual. Novos recortes podem ser
              adicionados sem expor dados pessoais desnecessários.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Dados auditáveis
          </span>
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {cards.map(([key, value]) => (
          <AppMetricCard key={key} label={labels[key] ?? key} value={value} />
        ))}
      </section>
    </div>
  );
}
