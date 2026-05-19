import { FormEvent, useEffect, useState } from 'react'
import { Building2, KeyRound, Plus, ShieldCheck } from 'lucide-react'
import { api } from '../services/api'
import type { Company } from '../types'

const regionalCities = ['Jacarezinho', 'Cambará', 'Andirá', 'Bandeirantes', 'Santo Antônio da Platina', 'Ribeirão Claro', 'Carlópolis', 'Siqueira Campos', 'Joaquim Távora', 'Ibaiti', 'Wenceslau Braz', 'Tomazina', 'Pinhalão', 'Quatiguá', 'Salto do Itararé', 'Barra do Jacaré']

const emptyCompany = {
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
  lgpd_accepted: true
}

type PortalUserResult = {
  email: string
  full_name: string
  temporary_password?: string | null
  created: boolean
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [form, setForm] = useState(emptyCompany)
  const [userCompanyId, setUserCompanyId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [lastCredential, setLastCredential] = useState<PortalUserResult | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function refresh() {
    api.get<Company[]>('/companies').then(({ data }) => {
      setCompanies(data)
      if (!userCompanyId && data[0]) setUserCompanyId(data[0].id)
    }).catch(() => setCompanies([]))
  }

  useEffect(() => {
    refresh()
  }, [])

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const { data } = await api.post<Company>('/companies', form)
      setForm(emptyCompany)
      setUserCompanyId(data.id)
      setUserEmail(data.email ?? '')
      setUserName(data.hr_responsible_name ?? data.responsible_name ?? '')
      setMessage('Empresa cadastrada. Ela já está disponível no dashboard operacional do SINE.')
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível cadastrar a empresa.')
    } finally {
      setSaving(false)
    }
  }

  async function createPortalUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    setLastCredential(null)
    try {
      const { data } = await api.post<PortalUserResult>(`/companies/${userCompanyId}/portal-user`, {
        email: userEmail,
        full_name: userName,
        position: 'Responsável pelo RH'
      })
      setLastCredential(data)
      setMessage(data.created ? 'Usuário da empresa criado. Repasse a senha temporária com segurança.' : 'Usuário existente vinculado à empresa.')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível gerar o usuário da empresa.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Empresas</h1>
          <p className="mt-1 text-sm text-slate-600">Cadastre empresas, gere usuários de acesso e acompanhe a disponibilidade para vagas e feedbacks.</p>
        </div>
        <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          {companies.length} empresa(s) no SINE
        </div>
      </div>

      {(message || error) && <div className={`rounded-md border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{error || message}</div>}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={createCompany} className="rounded-md border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <Building2 className="text-emerald-700" size={22} />
            <div>
              <h2 className="text-lg font-bold text-slate-950">Cadastrar empresa pelo SINE</h2>
              <p className="text-sm text-slate-600">Este cadastro também habilita a empresa para receber um usuário do portal.</p>
            </div>
          </div>
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
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Responsável pelo RH<input required value={form.hr_responsible_name} onChange={(e) => setForm({ ...form, hr_responsible_name: e.target.value, responsible_name: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-950">
            <input required type="checkbox" checked={form.lgpd_accepted} onChange={(e) => setForm({ ...form, lgpd_accepted: e.target.checked })} className="mt-1" />
            <span><ShieldCheck size={16} className="mr-1 inline" /> Consentimento LGPD registrado para tratamento dos dados da empresa e do responsável pelo RH.</span>
          </label>
          <button disabled={saving} className="tenant-button mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"><Plus size={17} /> {saving ? 'Cadastrando...' : 'Cadastrar empresa'}</button>
        </form>

        <div className="space-y-5">
          <form onSubmit={createPortalUser} className="rounded-md border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <KeyRound className="text-emerald-700" size={22} />
              <div>
                <h2 className="text-lg font-bold text-slate-950">Gerar usuário da empresa</h2>
                <p className="text-sm text-slate-600">A empresa poderá postar vagas, receber encaminhamentos e retornar feedback.</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Empresa<select required value={userCompanyId} onChange={(e) => setUserCompanyId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2">{companies.map((company) => <option key={company.id} value={company.id}>{company.trade_name || company.legal_name}</option>)}</select></label>
              <label className="block text-sm font-medium text-slate-700">Nome do usuário<input required value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-slate-700">E-mail de login<input required type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
            </div>
            <button className="tenant-button mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"><KeyRound size={17} /> Gerar acesso</button>
            {lastCredential && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <div className="font-bold">{lastCredential.email}</div>
                <div>{lastCredential.temporary_password ? `Senha temporária: ${lastCredential.temporary_password}` : 'Usuário vinculado. A senha existente foi preservada.'}</div>
              </div>
            )}
          </form>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">Últimas empresas</h2>
            <div className="mt-3 space-y-2">
              {companies.slice(0, 6).map((company) => (
                <button key={company.id} type="button" onClick={() => { setUserCompanyId(company.id); setUserEmail(company.email ?? ''); setUserName(company.hr_responsible_name ?? company.responsible_name ?? '') }} className="w-full rounded-md border border-slate-100 bg-slate-50 p-3 text-left hover:border-emerald-300">
                  <div className="font-semibold text-slate-950">{company.trade_name || company.legal_name}</div>
                  <div className="text-xs text-slate-500">{company.cnpj} · {company.city} / {company.state}</div>
                </button>
              ))}
              {companies.length === 0 && <p className="text-sm text-slate-500">Nenhuma empresa cadastrada.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
