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

type UploadedResume = {
  id: string
  original_filename: string
  size_bytes: number
  status: string
  created_at: string
  analysis?: {
    summary?: string
    skills?: string[]
  }
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
  const [resumes, setResumes] = useState<UploadedResume[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')

  useEffect(() => {
    api.get('/worker-portal/profile').then(({ data }) => {
      if (!data) return
      setProfile({ ...emptyProfile, ...data, birth_date: data.birth_date ?? '', disability_notes: data.disability_notes ?? '', notes: data.notes ?? '' })
    }).catch(() => undefined)
    loadResumes()
  }, [])

  function loadResumes() {
    api.get<UploadedResume[]>('/worker-portal/resumes').then(({ data }) => setResumes(data)).catch(() => setResumes([]))
  }

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

  async function uploadPdf(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedFile) {
      setUploadMessage('Selecione um arquivo PDF.')
      return
    }
    setUploading(true)
    setUploadMessage('')
    try {
      const form = new FormData()
      form.append('file', selectedFile)
      await api.post('/worker-portal/resume-pdf', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSelectedFile(null)
      setUploadMessage('Currículo em PDF enviado e analisado com sucesso.')
      loadResumes()
    } catch (error: any) {
      setUploadMessage(error?.response?.data?.detail ?? 'Não foi possível enviar o PDF.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Meu currículo</h1>
        <p className="mt-1 text-sm text-slate-600">Preencha seus dados para concorrer às vagas abertas pelo SINE.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={submit} className="rounded-md border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Opção 1: preencher currículo no portal</h2>
          <p className="mt-1 text-sm text-slate-600">Use esta opção para manter seus dados atualizados diretamente no sistema.</p>
        </div>
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

      <aside className="space-y-5">
        <form onSubmit={uploadPdf} className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Opção 2: enviar currículo em PDF</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Envie um arquivo PDF para o SINE analisar. O sistema extrai o texto e gera uma sugestão automática para apoiar o atendimento.</p>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Arquivo PDF</span>
            <input className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" type="file" accept="application/pdf,.pdf" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
          </label>
          {selectedFile && <div className="mt-3 text-sm text-slate-600">{selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>}
          {uploadMessage && <div className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{uploadMessage}</div>}
          <button className="tenant-button mt-5 w-full rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-70" disabled={uploading}>{uploading ? 'Enviando...' : 'Enviar PDF'}</button>
          <p className="mt-4 text-xs leading-5 text-slate-500">A análise automática é apenas uma sugestão. A decisão final é do colaborador responsável.</p>
        </form>

        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">PDFs enviados</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {resumes.length === 0 && <div className="py-4 text-sm text-slate-500">Nenhum PDF enviado até agora.</div>}
            {resumes.map((resume) => (
              <div key={resume.id} className="py-3">
                <div className="font-semibold text-slate-950">{resume.original_filename}</div>
                <div className="mt-1 text-sm text-slate-500">{resume.status} · {(resume.size_bytes / 1024 / 1024).toFixed(2)} MB · {new Date(resume.created_at).toLocaleDateString('pt-BR')}</div>
                {resume.analysis?.summary && <p className="mt-2 text-sm leading-5 text-slate-600">{resume.analysis.summary}</p>}
                {resume.analysis?.skills && resume.analysis.skills.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{resume.analysis.skills.slice(0, 6).map((skill) => <span key={skill} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{skill}</span>)}</div>}
              </div>
            ))}
          </div>
        </section>
      </aside>
      </div>
    </div>
  )
}
