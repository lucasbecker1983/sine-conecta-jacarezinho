import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bot, BriefcaseBusiness, Building2, CheckCircle2, ClipboardList, FileText, MessageSquare, Sparkles, UserRoundSearch, type LucideIcon } from 'lucide-react'
import { api } from '../services/api'
import type { Company, Summary } from '../types'
import { CandidateMatchCanvas } from '../canvas/CandidateMatchCanvas'
import { DashboardHeroCanvas } from '../canvas/DashboardHeroCanvas'
import { ResumeInsightCanvas } from '../canvas/ResumeInsightCanvas'
import { useAuthStore } from '../stores/auth'
import { CompanyDashboard } from './CompanyDashboard'

const operationalCards: Array<[string, string, LucideIcon]> = [
  ['vagas_solicitadas', 'Novas solicitações de vagas', BriefcaseBusiness],
  ['vagas_em_analise', 'Empresas aguardando aprovação', Building2],
  ['curriculos_pendentes', 'Candidatos pendentes de análise', FileText],
  ['candidatos_cadastrados', 'Currículos recebidos', ClipboardList],
  ['vagas_ativas', 'Vagas em triagem', UserRoundSearch],
  ['encaminhamentos_mes', 'Encaminhamentos aguardando retorno', MessageSquare],
  ['empresas_aguardando_retorno', 'Empresas bloqueadas por feedback', AlertTriangle],
  ['contratacoes_informadas', 'Tarefas concluídas no mês', CheckCircle2]
]

export function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [summary, setSummary] = useState<Summary>({})
  const [companies, setCompanies] = useState<Company[]>([])
  const [selected, setSelected] = useState('Clique em um candidato no mapa')
  const roles = user?.roles ?? []
  const isCompany = roles.includes('company_user')
  const isWorker = roles.includes('worker')

  useEffect(() => {
    if (isCompany || isWorker) return
    Promise.all([api.get<Summary>('/reports/summary'), api.get<Company[]>('/companies')])
      .then(([report, companyList]) => {
        setSummary(report.data)
        setCompanies(companyList.data)
      })
      .catch(() => {
        setSummary({})
        setCompanies([])
      })
  }, [isCompany, isWorker])

  if (isCompany) {
    return <CompanyDashboard />
  }

  if (isWorker) {
    return (
      <div className="space-y-5">
        <section className="overflow-hidden rounded-md border border-emerald-100 bg-white">
          <div className="grid gap-0 xl:grid-cols-[1fr_380px]">
            <div className="p-5 sm:p-7">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Portal do Trabalhador</span>
              <h1 className="mt-4 text-2xl font-bold text-slate-950">Currículo pronto para boas oportunidades</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Atualize seus dados, escolha uma vaga e acompanhe os encaminhamentos feitos pelo SINE.</p>
            </div>
            <div className="border-t border-emerald-100 bg-emerald-50/40 p-4 xl:border-l xl:border-t-0">
              <DashboardHeroCanvas variant="worker" primary={1} secondary={3} />
            </div>
          </div>
        </section>
        <div className="grid gap-3 md:grid-cols-3">
          <Link to="/vagas-abertas" className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400">
            <div className="text-sm font-semibold text-emerald-700">1. Escolher vaga</div>
            <div className="mt-3 text-sm text-slate-600">A seleção da vaga vem antes do envio do currículo.</div>
          </Link>
          <Link to="/meu-curriculo" className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400">
            <div className="text-sm font-semibold text-emerald-700">2. Enviar currículo</div>
            <div className="mt-3 text-sm text-slate-600">Preencha no portal ou envie PDF depois de selecionar a vaga.</div>
          </Link>
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-emerald-700">Encaminhamentos</div>
            <div className="mt-3 text-sm text-slate-600">Acompanhe o andamento após a análise do SINE.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-md border border-emerald-100 bg-white">
        <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
          <div className="p-5 sm:p-7">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Operação SINE</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Dashboard operacional</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Fila de vagas, currículos, encaminhamentos e retorno das empresas em uma visão auditável.</p>
          </div>
          <div className="border-t border-emerald-100 bg-emerald-50/40 p-4 xl:border-l xl:border-t-0">
            <DashboardHeroCanvas variant="sine" primary={summary.curriculos_pendentes ?? 0} secondary={companies.length} locked={(summary.empresas_aguardando_retorno ?? 0) > 0} />
          </div>
        </div>
      </section>
      <div className="grid gap-3 md:grid-cols-4">
        {operationalCards.map(([key, label, Icon]) => (
          <div key={String(key)} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-slate-500">{String(label)}</div>
              <Icon className="text-emerald-700" size={18} />
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-950">{summary[String(key)] ?? 0}</div>
          </div>
        ))}
      </div>
      <section className="rounded-md border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900"><Bot size={15} /> Assistente IA do SINE</div>
            <h2 className="mt-3 text-lg font-bold text-slate-950">Apoio inteligente para triagem, sem substituir o colaborador</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">A IA pode resumir currículo, extrair habilidades, comparar currículo com vaga, sugerir candidatos compatíveis, explicar aderência, sugerir perguntas para entrevista e apontar dados faltantes no cadastro.</p>
            <p className="mt-2 text-sm font-semibold text-amber-800">A IA é apenas apoio à triagem. A decisão final é do colaborador do SINE.</p>
          </div>
          <Link to="/curriculos" className="tenant-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"><Sparkles size={17} /> Analisar currículos</Link>
        </div>
      </section>
      <section className="rounded-md border border-emerald-100 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950">Empresas cadastradas e disponíveis ao SINE</h2>
            <p className="text-sm text-slate-600">Cadastros feitos pelo portal da empresa ou criados pelos colaboradores aparecem na mesma fila operacional.</p>
          </div>
          <Link to="/empresas" className="tenant-button rounded-md px-3 py-2 text-sm font-semibold">Gerir empresas</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {companies.slice(0, 3).map((company) => (
            <div key={company.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-950">{company.trade_name || company.legal_name}</div>
              <div className="mt-1 text-sm text-slate-600">{company.cnpj} · {company.city ?? 'Região'} / {company.state ?? 'PR'}</div>
              <div className="mt-3 text-xs font-semibold text-emerald-800">{company.lgpd_accepted ? 'LGPD aceita' : 'LGPD pendente'}</div>
            </div>
          ))}
          {companies.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 md:col-span-3">Nenhuma empresa cadastrada ainda.</div>}
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-950">Compatibilidade candidato/vaga</h2>
            <span className="text-sm text-slate-500">{selected}</span>
          </div>
          <CandidateMatchCanvas onSelect={(candidate) => setSelected(`${candidate.name} · ${candidate.score}%`)} />
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-bold text-slate-950">Leitura visual do currículo</h2>
          <ResumeInsightCanvas />
        </section>
      </div>
    </div>
  )
}
