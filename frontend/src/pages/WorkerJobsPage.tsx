import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

type Job = {
  id: string
  title: string
  description: string
  vacancies: number
  salary_range?: string
  workplace?: string
  modality: string
  minimum_education?: string
  status: string
}

type Application = {
  id: string
  job_id: string
  job_title: string
  status: string
  created_at: string
}

export function WorkerJobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [message, setMessage] = useState('')
  const selected = jobs.find((job) => job.id === selectedJobId)

  function load() {
    api.get<Job[]>('/worker-portal/open-jobs').then(({ data }) => {
      setJobs(data)
      setSelectedJobId((current) => current || data[0]?.id || '')
    }).catch(() => setJobs([]))
    api.get<Application[]>('/worker-portal/applications').then(({ data }) => setApplications(data)).catch(() => setApplications([]))
  }

  useEffect(() => {
    load()
  }, [])

  function continueToResume() {
    if (!selectedJobId) return
    navigate(`/meu-curriculo?vaga=${selectedJobId}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Vagas abertas</h1>
        <p className="mt-1 text-sm text-slate-600">Escolha uma vaga disponível. Depois envie ou preencha seu currículo para concluir a candidatura.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-950">Selecionar vaga</h2>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Vaga</span>
            <select className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-700" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
              {jobs.length === 0 && <option value="">Nenhuma vaga aberta no momento</option>}
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </label>
          {selected && (
            <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
              <div className="text-lg font-bold text-slate-950">{selected.title}</div>
              <p className="mt-2 leading-6">{selected.description}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <span>Vagas: {selected.vacancies}</span>
                <span>Modalidade: {selected.modality}</span>
                <span>Salário: {selected.salary_range || 'A combinar'}</span>
                <span>Local: {selected.workplace || 'Não informado'}</span>
              </div>
            </div>
          )}
          {message && <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>}
          <button className="tenant-button mt-5 w-full rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" disabled={!selectedJobId} onClick={continueToResume}>Continuar para o currículo</button>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-950">Minhas candidaturas</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {applications.length === 0 && <div className="py-6 text-sm text-slate-500">Você ainda não se candidatou a nenhuma vaga.</div>}
            {applications.map((application) => (
              <div key={application.id} className="py-3">
                <div className="font-semibold text-slate-950">{application.job_title}</div>
                <div className="mt-1 text-sm text-slate-500">{application.status} · {new Date(application.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
