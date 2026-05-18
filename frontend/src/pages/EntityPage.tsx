import { useEffect, useState } from 'react'
import { api } from '../services/api'

type Props = {
  title: string
  description: string
  endpoint?: string
  actionLabel?: string
}

export function EntityPage({ title, description, endpoint, actionLabel = 'Novo registro' }: Props) {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    if (endpoint) api.get(endpoint).then(({ data }) => setItems(data)).catch(() => setItems([]))
  }, [endpoint])
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <button className="tenant-button rounded-md px-4 py-2 text-sm font-semibold">{actionLabel}</button>
      </div>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Criado em</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td className="px-4 py-6 text-slate-500" colSpan={3}>Nenhum registro encontrado.</td></tr>}
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{item.legal_name || item.full_name || item.title || item.original_filename || item.id}</td>
                <td className="px-4 py-3 text-slate-600">{item.status || 'ativo'}</td>
                <td className="px-4 py-3 text-slate-600">{item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
