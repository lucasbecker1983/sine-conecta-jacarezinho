import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { AppButton, AppPageHeader, AppTable } from '../components/ui'
import { friendlyStatus } from '../utils/statusLabels'

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
      <AppPageHeader
        title={title}
        description={description}
        action={<AppButton aria-label={actionLabel}>{actionLabel}</AppButton>}
      />
      <AppTable
        rows={items}
        empty="Nenhum registro encontrado."
        columns={[
          {
            key: "name",
            header: "Nome",
            render: (item) => (
              <span className="font-medium text-slate-900">
                {item.legal_name ||
                  item.full_name ||
                  item.title ||
                  item.original_filename ||
                  item.id}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item) => friendlyStatus(item.status || "ativo"),
          },
          {
            key: "created_at",
            header: "Criado em",
            render: (item) =>
              item.created_at
                ? new Date(item.created_at).toLocaleDateString("pt-BR")
                : "Sem data registrada",
          },
        ]}
      />
    </div>
  )
}
