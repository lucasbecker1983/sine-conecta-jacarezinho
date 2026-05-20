import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

export function AppTable<T extends { id: string }>({ rows, columns, empty }: { rows: T[]; columns: Column<T>[]; empty?: ReactNode }) {
  if (!rows.length) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">{empty ?? "Ainda não há informações para exibir aqui."}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
          <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3">{column.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {columns.map((column) => <td key={column.key} className="px-4 py-3 text-slate-700">{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
