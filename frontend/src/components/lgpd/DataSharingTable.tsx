export type DataSharingRecord = {
  id: string;
  worker_name?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  data_categories?: string[] | Record<string, unknown> | null;
  purpose: string;
  shared_at: string;
};

function categoriesLabel(categories: DataSharingRecord["data_categories"]) {
  if (Array.isArray(categories)) return categories.join(", ");
  if (categories && typeof categories === "object") return Object.keys(categories).join(", ");
  return "Dados mínimos para o encaminhamento";
}

export function DataSharingTable({ records }: { records: DataSharingRecord[] }) {
  if (!records.length) {
    return <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">Nenhum compartilhamento registrado.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Titular</th>
            <th className="px-4 py-3">Empresa</th>
            <th className="px-4 py-3">Vaga</th>
            <th className="px-4 py-3">Dados</th>
            <th className="px-4 py-3">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="px-4 py-3 text-slate-800">{record.worker_name ?? "Titular"}</td>
              <td className="px-4 py-3 text-slate-800">{record.company_name ?? "Empresa"}</td>
              <td className="px-4 py-3 text-slate-600">{record.job_title ?? "Vaga vinculada"}</td>
              <td className="px-4 py-3 text-slate-600">{categoriesLabel(record.data_categories)}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(record.shared_at).toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
