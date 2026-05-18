import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Summary } from '../types'
import { CandidateMatchCanvas } from '../canvas/CandidateMatchCanvas'
import { ResumeInsightCanvas } from '../canvas/ResumeInsightCanvas'
import { useAuthStore } from '../stores/auth'

const labels: Record<string, string> = {
  vagas_solicitadas: 'Vagas solicitadas',
  vagas_em_analise: 'Vagas em análise',
  vagas_ativas: 'Vagas ativas',
  candidatos_cadastrados: 'Candidatos cadastrados',
  curriculos_pendentes: 'Currículos pendentes',
  encaminhamentos_mes: 'Encaminhamentos no mês',
  contratacoes_informadas: 'Contratações informadas',
  empresas_aguardando_retorno: 'Empresas aguardando retorno'
}

export function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [summary, setSummary] = useState<Summary>({})
  const [selected, setSelected] = useState('Clique em um candidato no mapa')
  const roles = user?.roles ?? []
  const isCompany = roles.includes('company_user')
  const isWorker = roles.includes('worker')

  useEffect(() => {
    if (isCompany || isWorker) return
    api.get<Summary>('/reports/summary').then(({ data }) => setSummary(data)).catch(() => setSummary({}))
  }, [isCompany, isWorker])

  if (isCompany) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Portal da Empresa</h1>
          <p className="mt-1 text-sm text-slate-600">Solicite vagas, acompanhe encaminhamentos e registre o retorno dos candidatos.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {['Solicitar nova vaga', 'Candidatos encaminhados', 'Retornos pendentes'].map((label) => (
            <div key={label} className="rounded-md border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-emerald-700">{label}</div>
              <div className="mt-3 text-3xl font-bold text-slate-950">0</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isWorker) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Portal do Trabalhador</h1>
          <p className="mt-1 text-sm text-slate-600">Atualize seus dados, acompanhe currículo e visualize encaminhamentos do SINE.</p>
        </div>
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
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Dashboard operacional</h1>
        <p className="mt-1 text-sm text-slate-600">Fila de vagas, currículos, encaminhamentos e retorno das empresas.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key} className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-950">{summary[key] ?? 0}</div>
          </div>
        ))}
      </div>
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
