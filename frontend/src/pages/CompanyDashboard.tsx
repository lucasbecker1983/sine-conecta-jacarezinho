import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, BriefcaseBusiness, CheckCircle2, FileCheck2, LockKeyhole, MessageSquareReply, Send, ShieldCheck, UserRoundSearch } from 'lucide-react'
import { api } from '../services/api'
import type { Company, Job } from '../types'
import { DashboardHeroCanvas } from '../canvas/DashboardHeroCanvas'
import sineLogoFullHd from '../assets/logos/sine-logo-fullhd.png'

const regionalCities = ['Jacarezinho', 'Cambará', 'Andirá', 'Bandeirantes', 'Santo Antônio da Platina', 'Ribeirão Claro', 'Carlópolis', 'Siqueira Campos', 'Joaquim Távora', 'Ibaiti', 'Wenceslau Braz', 'Tomazina', 'Pinhalão', 'Quatiguá', 'Salto do Itararé', 'Barra do Jacaré']

type CompanyForm = {
  cnpj: string
  legal_name: string
  trade_name: string
  state_registration: string
  federal_registration: string
  city: string
  state: string
  cep: string
  email: string
  phone: string
  whatsapp: string
  responsible_name: string
  hr_responsible_name: string
  segment: string
  notes: string
  lgpd_accepted: boolean
}

type JobForm = {
  title: string
  description: string
  vacancies: number
  start_date: string
  closing_deadline: string
  salary_range: string
  benefits: string
  workday: string
  schedule: string
  workplace: string
  modality: string
  minimum_education: string
  required_experience: string
  desired_courses: string
  cnh_required: string
  contract_type: string
  notes: string
  travel_required: boolean
}

type PortalStatus = {
  profile_complete: boolean
  pending_returns: number
  can_open_job: boolean
  ai_scope: string
}

type CompanyReferral = {
  id: string
  job_title: string
  worker_name: string
  worker_email?: string | null
  worker_phone?: string | null
  worker_whatsapp?: string | null
  resume_filename?: string | null
  status: string
  match_score?: number | null
  created_at: string
}

const emptyCompany: CompanyForm = {
  cnpj: '',
  legal_name: '',
  trade_name: '',
  state_registration: '',
  federal_registration: '',
  city: 'Jacarezinho',
  state: 'PR',
  cep: '',
  email: '',
  phone: '',
  whatsapp: '',
  responsible_name: '',
  hr_responsible_name: '',
  segment: '',
  notes: '',
  lgpd_accepted: false
}

const emptyJob: JobForm = {
  title: '',
  description: '',
  vacancies: 1,
  start_date: '',
  closing_deadline: '',
  salary_range: '',
  benefits: '',
  workday: '',
  schedule: '',
  workplace: '',
  modality: 'presencial',
  minimum_education: '',
  required_experience: '',
  desired_courses: '',
  cnh_required: '',
  contract_type: '',
  notes: '',
  travel_required: false
}

function asCompanyForm(company: Company | null): CompanyForm {
  if (!company) return emptyCompany
  return {
    cnpj: company.cnpj ?? '',
    legal_name: company.legal_name ?? '',
    trade_name: company.trade_name ?? '',
    state_registration: company.state_registration ?? '',
    federal_registration: company.federal_registration ?? '',
    city: company.city ?? 'Jacarezinho',
    state: company.state ?? 'PR',
    cep: company.cep ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    whatsapp: company.whatsapp ?? '',
    responsible_name: company.responsible_name ?? '',
    hr_responsible_name: company.hr_responsible_name ?? '',
    segment: company.segment ?? '',
    notes: company.notes ?? '',
    lgpd_accepted: company.lgpd_accepted
  }
}

function useCompanyPortal() {
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [referrals, setReferrals] = useState<CompanyReferral[]>([])
  const [status, setStatus] = useState<PortalStatus>({ profile_complete: false, pending_returns: 0, can_open_job: false, ai_scope: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function refresh() {
    setLoading(true)
    Promise.all([
      api.get<Company | null>('/company-portal/profile'),
      api.get<Job[]>('/company-portal/jobs'),
      api.get<CompanyReferral[]>('/company-portal/referrals'),
      api.get<PortalStatus>('/company-portal/status')
    ])
      .then(([profile, companyJobs, companyReferrals, portalStatus]) => {
        setCompany(profile.data)
        setJobs(companyJobs.data)
        setReferrals(companyReferrals.data)
        setStatus(portalStatus.data)
        setError('')
      })
      .catch(() => setError('Não foi possível carregar a área da empresa agora.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  return { company, jobs, referrals, status, loading, error, refresh, setError }
}

function PortalAlert({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null
  return <div className={`rounded-md border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{error || message}</div>
}

export function CompanyDashboard() {
  const { company, jobs, referrals, status, loading, error } = useCompanyPortal()
  const latestJobs = useMemo(() => jobs.slice(0, 3), [jobs])
  const latestReferrals = useMemo(() => referrals.slice(0, 3), [referrals])

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-md border border-emerald-100 bg-white">
        <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <img
                src={sineLogoFullHd}
                alt="Logotipo do SINE Jacarezinho"
                className="h-9 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[170px]"
                width={170}
                height={59}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"><ShieldCheck size={14} /> Portal da Empresa</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"><LockKeyhole size={14} /> LGPD e auditoria ativas</span>
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">{company?.trade_name || company?.legal_name || 'Área da empresa'}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              A empresa cadastra dados, abre vagas e devolve feedback. A IA fica do lado do SINE, como apoio aos colaboradores na triagem.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">Cadastro</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-950">
                  {status.profile_complete ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-amber-600" />}
                  {status.profile_complete ? 'Disponível ao SINE' : 'Pendente'}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">Vagas solicitadas</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{jobs.length}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">Retornos pendentes</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{status.pending_returns}</div>
              </div>
            </div>
          </div>
          <div className="border-t border-emerald-100 bg-emerald-50/40 p-4 xl:border-l xl:border-t-0">
            <DashboardHeroCanvas variant="company" primary={jobs.length} secondary={referrals.length} locked={!status.can_open_job} />
          </div>
        </div>
      </section>

      <PortalAlert error={error} />

      <div className="grid gap-3 md:grid-cols-3">
        <Link to="/empresa/cadastro" className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400">
          <FileCheck2 className="text-emerald-700" size={22} />
          <div className="mt-3 font-bold text-slate-950">Cadastro da empresa</div>
          <p className="mt-1 text-sm text-slate-600">Dados legais, contatos, responsável pelo RH e aceite LGPD.</p>
        </Link>
        <Link to="/empresa/vagas" className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400">
          <BriefcaseBusiness className="text-emerald-700" size={22} />
          <div className="mt-3 font-bold text-slate-950">Abrir vagas</div>
          <p className="mt-1 text-sm text-slate-600">{status.can_open_job ? 'Nova solicitação liberada.' : 'Bloqueado até registrar contratação ou não contratação anterior.'}</p>
        </Link>
        <Link to="/empresa/encaminhamentos" className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400">
          <UserRoundSearch className="text-emerald-700" size={22} />
          <div className="mt-3 font-bold text-slate-950">Encaminhamentos</div>
          <p className="mt-1 text-sm text-slate-600">Veja candidatos enviados pelo SINE e registre o retorno.</p>
        </Link>
        <Link to="/empresa/comunicacao" className="rounded-md border border-slate-200 bg-white p-5 hover:border-emerald-400 md:col-span-3">
          <MessageSquareReply className="text-emerald-700" size={22} />
          <div className="mt-3 font-bold text-slate-950">Comunicação oficial com o SINE</div>
          <p className="mt-1 text-sm text-slate-600">Mensagens vinculadas a vagas, encaminhamentos, currículos e feedbacks com trilha de auditoria.</p>
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Vagas recentes</h2>
          <div className="mt-3 space-y-2">
            {loading && <p className="text-sm text-slate-500">Carregando...</p>}
            {!loading && latestJobs.length === 0 && <p className="text-sm text-slate-500">Nenhuma vaga solicitada ainda.</p>}
            {latestJobs.map((job) => <div key={job.id} className="rounded-md border border-slate-100 bg-slate-50 p-3"><div className="font-semibold text-slate-950">{job.title}</div><div className="mt-1 text-xs text-slate-500">{job.status}</div></div>)}
          </div>
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Últimos encaminhamentos</h2>
          <div className="mt-3 space-y-2">
            {loading && <p className="text-sm text-slate-500">Carregando...</p>}
            {!loading && latestReferrals.length === 0 && <p className="text-sm text-slate-500">Ainda não há candidatos encaminhados.</p>}
            {latestReferrals.map((referral) => <div key={referral.id} className="rounded-md border border-slate-100 bg-slate-50 p-3"><div className="font-semibold text-slate-950">{referral.worker_name}</div><div className="mt-1 text-xs text-slate-500">{referral.job_title} · {referral.status}</div></div>)}
          </div>
        </section>
      </div>
    </div>
  )
}

export function CompanyProfilePage() {
  const { company, error, refresh, setError } = useCompanyPortal()
  const [form, setForm] = useState<CompanyForm>(emptyCompany)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setForm(asCompanyForm(company))
  }, [company])

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.put<Company>('/company-portal/profile', form)
      setMessage('Cadastro da empresa salvo e disponibilizado para a equipe do SINE.')
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Revise os dados obrigatórios da empresa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Cadastro da empresa</h1>
        <p className="mt-1 text-sm text-slate-600">Dados oficiais, contatos, região atendida e consentimento LGPD.</p>
      </div>
      <PortalAlert message={message} error={error} />
      <form onSubmit={saveCompany} className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Razão social<input required value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Nome fantasia<input value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">CNPJ<input required value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Inscrição estadual<input value={form.state_registration} onChange={(e) => setForm({ ...form, state_registration: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Inscrição federal<input value={form.federal_registration} onChange={(e) => setForm({ ...form, federal_registration: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">CEP<input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Cidade<select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2">{regionalCities.map((city) => <option key={city}>{city}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Estado<input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} maxLength={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">E-mail<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Telefone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">WhatsApp<input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Responsável pelo RH<input required value={form.hr_responsible_name} onChange={(e) => setForm({ ...form, hr_responsible_name: e.target.value, responsible_name: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
        </div>
        <label className="mt-3 block text-sm font-medium text-slate-700">Observações institucionais<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
        <label className="mt-4 flex items-start gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-950"><input required type="checkbox" checked={form.lgpd_accepted} onChange={(e) => setForm({ ...form, lgpd_accepted: e.target.checked })} className="mt-1" /><span>Declaro ciência e aceite dos termos da LGPD para tratamento dos dados da empresa, contatos e histórico de vagas pelo SINE Jacarezinho.</span></label>
        <button disabled={saving} className="tenant-button mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"><ShieldCheck size={17} /> {saving ? 'Salvando...' : 'Salvar cadastro'}</button>
      </form>
    </div>
  )
}

export function CompanyJobsPage() {
  const { jobs, status, error, refresh, setError } = useCompanyPortal()
  const [form, setForm] = useState<JobForm>(emptyJob)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const lockedReason = !status.profile_complete ? 'Complete o cadastro e aceite os termos da LGPD para solicitar vagas.' : status.pending_returns > 0 ? 'Empresa bloqueada: registre se houve contratação, dispensa, não comparecimento, banco futuro ou sem interesse antes de abrir nova vaga.' : ''

  async function createJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.post<Job>('/company-portal/jobs', { ...form, vacancies: Number(form.vacancies) || 1 })
      setForm(emptyJob)
      setMessage('Vaga enviada ao SINE. A triagem com IA permanece sob responsabilidade dos colaboradores.')
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível abrir a vaga agora.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Vagas da empresa</h1>
        <p className="mt-1 text-sm text-slate-600">Solicite vagas com datas e requisitos detalhados. A IA atua apenas do lado do SINE.</p>
      </div>
      <PortalAlert message={message} error={error} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={createJob} className="rounded-md border border-slate-200 bg-white p-5">
          {lockedReason && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{lockedReason}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Cargo<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Data de início<input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Data final<input type="date" value={form.closing_deadline} onChange={(e) => setForm({ ...form, closing_deadline: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Vagas<input type="number" min={1} value={form.vacancies} onChange={(e) => setForm({ ...form, vacancies: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Modalidade<select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"><option value="presencial">Presencial</option><option value="hibrido">Híbrido</option><option value="remoto">Remoto</option></select></label>
            <label className="text-sm font-medium text-slate-700">Local de trabalho<input value={form.workplace} onChange={(e) => setForm({ ...form, workplace: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Jornada<input value={form.workday} onChange={(e) => setForm({ ...form, workday: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Horário<input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Salário ou faixa<input value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Descrição detalhada<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Requisitos detalhados<textarea required value={form.required_experience} onChange={(e) => setForm({ ...form, required_experience: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Escolaridade mínima<input value={form.minimum_education} onChange={(e) => setForm({ ...form, minimum_education: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">CNH exigida<input value={form.cnh_required} onChange={(e) => setForm({ ...form, cnh_required: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Cursos desejados<textarea value={form.desired_courses} onChange={(e) => setForm({ ...form, desired_courses: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Benefícios e observações<textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          </div>
          <button disabled={!status.can_open_job || saving} className="tenant-button mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Send size={17} /> {saving ? 'Enviando...' : 'Enviar vaga ao SINE'}</button>
        </form>
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Histórico de vagas</h2>
          <div className="mt-3 space-y-2">{jobs.length === 0 && <p className="text-sm text-slate-500">Nenhuma vaga solicitada ainda.</p>}{jobs.map((job) => <div key={job.id} className="rounded-md border border-slate-100 bg-slate-50 p-3"><div className="font-semibold text-slate-950">{job.title}</div><div className="mt-1 text-xs text-slate-500">{job.status} · {job.start_date ? new Date(job.start_date).toLocaleDateString('pt-BR') : 'início a combinar'}</div></div>)}</div>
        </section>
      </div>
    </div>
  )
}

export function CompanyReferralsPage() {
  const { referrals, error, refresh, setError } = useCompanyPortal()
  const [feedback, setFeedback] = useState<Record<string, { status: string; comments: string }>>({})
  const [message, setMessage] = useState('')

  async function sendFeedback(referralId: string) {
    const item = feedback[referralId] ?? { status: 'entrevistado', comments: '' }
    setError('')
    setMessage('')
    try {
      await api.post(`/company-portal/referrals/${referralId}/feedback`, item)
      setMessage('Feedback registrado. O SINE já pode liberar o próximo ciclo de vagas quando não houver outros retornos pendentes.')
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível registrar o feedback.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Encaminhamentos</h1>
        <p className="mt-1 text-sm text-slate-600">Currículos enviados formalmente pelo SINE, com feedback obrigatório para liberar novas vagas.</p>
      </div>
      <Link to="/empresa/comunicacao" className="inline-flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
        <MessageSquareReply size={16} /> Abrir comunicação oficial
      </Link>
      <PortalAlert message={message} error={error} />
      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-3 lg:grid-cols-2">
          {referrals.map((referral) => {
            const current = feedback[referral.id] ?? { status: referral.status === 'encaminhado' ? 'entrevistado' : referral.status, comments: '' }
            return (
              <div key={referral.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-bold text-slate-950">{referral.worker_name}</div><div className="mt-1 text-sm text-slate-600">{referral.job_title}</div></div><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-800">{referral.status}</span></div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2"><div>{referral.worker_email ?? 'E-mail não informado'}</div><div>{referral.worker_whatsapp || referral.worker_phone || 'Telefone não informado'}</div><div>{referral.resume_filename ? `Currículo: ${referral.resume_filename}` : 'Currículo sem PDF anexado'}</div><div>{referral.match_score ? `Compatibilidade sugerida: ${referral.match_score}%` : 'Triagem acompanhada pelo SINE'}</div></div>
                <div className="mt-4 grid gap-2 md:grid-cols-[180px_1fr]"><select value={current.status} onChange={(e) => setFeedback({ ...feedback, [referral.id]: { ...current, status: e.target.value } })} className="rounded-md border border-slate-200 px-3 py-2 text-sm"><option value="entrevistado">Entrevistado</option><option value="contratado">Contratado</option><option value="dispensado">Dispensado</option><option value="nao_compareceu">Não compareceu</option><option value="banco_futuro">Banco futuro</option><option value="sem_interesse">Sem interesse</option></select><input value={current.comments} onChange={(e) => setFeedback({ ...feedback, [referral.id]: { ...current, comments: e.target.value } })} placeholder="Comentário para o SINE" className="rounded-md border border-slate-200 px-3 py-2 text-sm" /></div>
                <button type="button" onClick={() => sendFeedback(referral.id)} className="tenant-button mt-3 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold"><MessageSquareReply size={16} /> Retornar feedback</button>
              </div>
            )
          })}
          {referrals.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 lg:col-span-2">Ainda não há currículos encaminhados pelo SINE para esta empresa.</div>}
        </div>
      </section>
    </div>
  )
}
