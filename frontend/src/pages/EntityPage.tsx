import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  AppButton,
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppInput,
  AppLoadingState,
  AppPageHeader,
  AppTable,
} from '../components/ui'
import { friendlyStatus } from '../utils/statusLabels'

type Props = {
  title: string
  description: string
  endpoint?: string
  actionLabel?: string
}

export function EntityPage({ title, description, endpoint, actionLabel = 'Novo registro' }: Props) {
  const navigate = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(Boolean(endpoint))
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const context = contextForTitle(title)
  const actionTarget = actionTargetForTitle(title)
  const filteredItems = items.filter((item) =>
    [
      item.legal_name,
      item.full_name,
      item.worker_name,
      item.job_title,
      item.company_name,
      item.title,
      item.original_filename,
      item.status,
      item.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  useEffect(() => {
    if (!endpoint) return
    setLoading(true)
    setError("")
    api
      .get(endpoint)
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {
        setItems([])
        setError(context.errorMessage)
      })
      .finally(() => setLoading(false))
  }, [endpoint])

  if (loading) return <AppLoadingState message={`Carregando ${title.toLowerCase()}...`} />
  if (error) return <AppErrorState message={error} />

  return (
    <div className="space-y-4">
      <AppPageHeader
        title={title}
        description={description || context.description}
        action={
          actionTarget ? (
            <AppButton
              aria-label={actionLabel}
              onClick={() => navigate(actionTarget)}
            >
              {actionLabel}
            </AppButton>
          ) : undefined
        }
      />
      {items.length > 0 && (
        <AppCard>
          <AppInput
            label={`Buscar em ${title.toLowerCase()}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Digite nome, título, status ou identificador"
          />
        </AppCard>
      )}
      <AppTable
        rows={filteredItems}
        empty={
          <AppEmptyState
            title={items.length > 0 ? "Nenhum resultado encontrado" : context.emptyTitle}
            message={
              items.length > 0
                ? "Tente buscar por outro nome, status ou identificador."
                : context.emptyMessage
            }
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
                  item.worker_name ||
                  item.title ||
                  item.job_title ||
                  item.original_filename ||
                  item.id}
                {item.worker_name && item.job_title ? (
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {item.job_title}
                    {item.company_name ? ` · ${item.company_name}` : ""}
                  </span>
                ) : null}
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
  if (normalized.includes("trabalh") || normalized.includes("candidat")) {
    return {
      description: "Acompanhe candidatos cadastrados e currículos disponíveis para análise.",
      emptyTitle: "Nenhum candidato encontrado",
      emptyMessage: "Novos cadastros aparecerão aqui quando os candidatos se registrarem ou forem cadastrados pelo SINE.",
      errorMessage: "Não foi possível carregar os candidatos agora.",
    };
  }
  if (normalized.includes("curr")) {
    return {
      description: "Consulte currículos recebidos e organize a análise do SINE.",
      emptyTitle: "Nenhum currículo recebido",
      emptyMessage: "Currículos enviados pelos candidatos aparecerão aqui para acompanhamento.",
      errorMessage: "Não foi possível carregar os currículos agora.",
    };
  }
  if (normalized.includes("vaga")) {
    return {
      description: "Acompanhe vagas solicitadas, em triagem ou publicadas.",
      emptyTitle: "Nenhuma vaga encontrada",
      emptyMessage: "As solicitações das empresas aparecerão aqui quando forem registradas.",
      errorMessage: "Não foi possível carregar as vagas agora.",
    };
  }
  if (normalized.includes("encaminh")) {
    return {
      description: "Acompanhe encaminhamentos oficiais e retornos das empresas.",
      emptyTitle: "Nenhum encaminhamento encontrado",
      emptyMessage: "Quando o SINE encaminhar candidatos para empresas, os registros aparecerão aqui.",
      errorMessage: "Não foi possível carregar os encaminhamentos agora.",
    };
  }
  if (normalized.includes("lgpd") || normalized.includes("auditoria")) {
    return {
      description: "Acompanhe solicitações, registros e cuidados de privacidade.",
      emptyTitle: "Nenhum registro de conformidade encontrado",
      emptyMessage: "Registros de atendimento, auditoria ou LGPD aparecerão aqui quando houver movimentação.",
      errorMessage: "Não foi possível carregar os registros de conformidade agora.",
    };
  }
  return {
    description: "Acompanhe registros importantes da operação do SINE.",
    emptyTitle: "Nenhum registro encontrado",
    emptyMessage: "Quando houver dados disponíveis, eles aparecerão aqui de forma organizada.",
    errorMessage: "Não foi possível carregar os registros agora.",
  };
}

function actionTargetForTitle(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("candidat") || normalized.includes("trabalh")) {
    return "/trabalhador/cadastro";
  }
  if (
    normalized.includes("curr") ||
    normalized.includes("vaga") ||
    normalized.includes("encaminh")
  ) {
    return "/sine/triagem";
  }
  return "";
}
