import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { AppButton, AppEmptyState, AppPageHeader, AppTable } from '../components/ui'
import { friendlyStatus } from '../utils/statusLabels'

type Props = {
  title: string
  description: string
  endpoint?: string
  actionLabel?: string
}

export function EntityPage({ title, description, endpoint, actionLabel = 'Novo registro' }: Props) {
  const [items, setItems] = useState<any[]>([])
  const context = contextForTitle(title)
  useEffect(() => {
    if (endpoint) api.get(endpoint).then(({ data }) => setItems(data)).catch(() => setItems([]))
  }, [endpoint])
  return (
    <div className="space-y-4">
      <AppPageHeader
        title={title}
        description={description || context.description}
        action={<AppButton aria-label={actionLabel}>{actionLabel}</AppButton>}
      />
      <AppTable
        rows={items}
        empty={
          <AppEmptyState
            title={context.emptyTitle}
            message={context.emptyMessage}
          />
        }
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

function contextForTitle(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("trabalh")) {
    return {
      description: "Acompanhe candidatos cadastrados e currículos disponíveis para análise.",
      emptyTitle: "Nenhum candidato encontrado",
      emptyMessage: "Novos cadastros aparecerão aqui quando os candidatos se registrarem ou forem cadastrados pelo SINE.",
    };
  }
  if (normalized.includes("curr")) {
    return {
      description: "Consulte currículos recebidos e organize a análise do SINE.",
      emptyTitle: "Nenhum currículo recebido",
      emptyMessage: "Currículos enviados pelos candidatos aparecerão aqui para acompanhamento.",
    };
  }
  if (normalized.includes("vaga")) {
    return {
      description: "Acompanhe vagas solicitadas, em triagem ou publicadas.",
      emptyTitle: "Nenhuma vaga encontrada",
      emptyMessage: "As solicitações das empresas aparecerão aqui quando forem registradas.",
    };
  }
  if (normalized.includes("encaminh")) {
    return {
      description: "Acompanhe encaminhamentos oficiais e retornos das empresas.",
      emptyTitle: "Nenhum encaminhamento encontrado",
      emptyMessage: "Quando o SINE encaminhar candidatos para empresas, os registros aparecerão aqui.",
    };
  }
  if (normalized.includes("lgpd") || normalized.includes("auditoria")) {
    return {
      description: "Acompanhe solicitações, registros e cuidados de privacidade.",
      emptyTitle: "Nenhum registro de conformidade encontrado",
      emptyMessage: "Registros de atendimento, auditoria ou LGPD aparecerão aqui quando houver movimentação.",
    };
  }
  return {
    description: "Acompanhe registros importantes da operação do SINE.",
    emptyTitle: "Nenhum registro encontrado",
    emptyMessage: "Quando houver dados disponíveis, eles aparecerão aqui de forma organizada.",
  };
}
