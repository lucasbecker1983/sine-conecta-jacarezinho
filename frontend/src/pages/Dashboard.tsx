import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { Summary } from '../types'
import { CandidateMatchCanvas } from '../canvas/CandidateMatchCanvas'
import { ResumeInsightCanvas } from '../canvas/ResumeInsightCanvas'

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
  const [summary, setSummary] = useState<Summary>({})
  const [selected, setSelected] = useState('Clique em um candidato no mapa')
  useEffect(() => {
    api.get<Summary>('/reports/summary').then(({ data }) => setSummary(data)).catch(() => setSummary({}))
  }, [])
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
