import { useEffect, useState } from 'react'
import { api } from '../services/api'

type WorkerProfile = {
  cpf: string
  full_name: string
  birth_date: string
  phone: string
  whatsapp: string
  address: string
  district: string
  city: string
  state: string
  education_level: string
  desired_role: string
  desired_salary: string
  availability: string
  cnh: string
  has_disability: boolean | null
  disability_notes: string
  notes: string
  lgpd_accepted: boolean
}

const emptyProfile: WorkerProfile = {
  cpf: '',
  full_name: '',
  birth_date: '',
  phone: '',
  whatsapp: '',
  address: '',
  district: '',
  city: 'Jacarezinho',
  state: 'PR',
  education_level: '',
  desired_role: '',
  desired_salary: '',
  availability: '',
  cnh: '',
  has_disability: null,
  disability_notes: '',
  notes: '',
  lgpd_accepted: false
}

const fields: Array<[keyof WorkerProfile, string, string]> = [
  ['cpf', 'CPF', 'text'],
  ['full_name', 'Nome completo', 'text'],
  ['birth_date', 'Data de nascimento', 'date'],
  ['phone', 'Telefone', 'text'],
  ['whatsapp', 'WhatsApp', 'text'],
  ['education_level', 'Escolaridade', 'text'],
  ['desired_role', 'Profissão pretendida', 'text'],
  ['desired_salary', 'Pretensão salarial', 'text'],
  ['availability', 'Disponibilidade de horário', 'text'],
  ['cnh', 'CNH', 'text'],
  ['address', 'Endereço', 'text'],
  ['district', 'Bairro', 'text'],
  ['city', 'Cidade', 'text'],
  ['state', 'Estado', 'text']
]

export function WorkerResumePage() {
  const [profile, setProfile] = useState<WorkerProfile>(emptyProfile)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/worker-portal/profile').then(({ data }) => {
      if (!data) return
      setProfile({ ...emptyProfile, ...data, birth_date: data.birth_date ?? '', disability_notes: data.disability_notes ?? '', notes: data.notes ?? '' })
    }).catch(() => undefined)
  }, [])

  function update(key: keyof WorkerProfile, value: string | boolean | null) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const payload = { ...profile, birth_date: profile.birth_date || null }
      const { data } = await api.put('/worker-portal/profile', payload)
      setProfile({ ...emptyProfile, ...data, birth_date: data.birth_date ?? '', disability_notes: data.disability_notes ?? '', notes: data.notes ?? '' })
      setMessage('Currículo salvo com sucesso.')
    } catch (error: any) {
      setMessage(error?.response?.data?.detail ?? 'Não foi possível salvar seu currículo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Meu currículo</h1>
        <p className="mt-1 text-sm text-slate-600">Preencha seus dados para concorrer às vagas abertas pelo SINE.</p>
      </div>

      <form onSubmit={submit} className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
              <input className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-700" type={type} value={String(profile[key] ?? '')} onChange={(event) => update(key, event.target.value)} required={key === 'cpf' || key === 'full_name'} />
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Possui deficiência?</span>
            <select className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-700" value={profile.has_disability === null ? '' : profile.has_disability ? 'sim' : 'nao'} onChange={(event) => update('has_disability', event.target.value === '' ? null : event.target.value === 'sim')}>
              <option value="">Não informado</option>
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Observações sobre acessibilidade</span>
            <input className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-700" value={profile.disability_notes} onChange={(event) => update('disability_notes', event.target.value)} />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Experiências, cursos, habilidades e observações</span>
          <textarea className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-700" value={profile.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Exemplo: atendimento ao público, informática, operador de caixa, cursos concluídos, experiências anteriores..." />
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-md bg-emerald-50 p-3 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={profile.lgpd_accepted} onChange={(event) => update('lgpd_accepted', event.target.checked)} required />
          <span>Autorizo o tratamento dos meus dados pelo SINE para cadastro, análise de currículo e candidatura a vagas, conforme LGPD.</span>
        </label>

        {message && <div className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</div>}

        <div className="mt-5 flex justify-end">
          <button className="tenant-button rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-70" disabled={saving}>{saving ? 'Salvando...' : 'Salvar currículo'}</button>
        </div>
      </form>
    </div>
  )
}
