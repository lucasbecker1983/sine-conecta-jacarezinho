import { useEffect, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, Building2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCurrentTenant, login } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { applyTenantTheme } from '../white-label/theme'
import { Logo } from '../components/Logo'
import { LoginNetworkCanvas } from '../canvas/LoginNetworkCanvas'

type AccessProfile = 'company' | 'worker' | 'staff'

const profiles = {
  company: {
    icon: Building2,
    title: 'Sou Empresa',
    eyebrow: 'Portal da Empresa',
    description: 'Solicite vagas, acompanhe candidatos encaminhados e registre retornos.',
    email: ''
  },
  worker: {
    icon: UserRound,
    title: 'Sou Trabalhador',
    eyebrow: 'Portal do Trabalhador',
    description: 'Atualize seu cadastro, envie currículo e acompanhe encaminhamentos.',
    email: ''
  },
  staff: {
    icon: BriefcaseBusiness,
    title: 'Sou Colaborador',
    eyebrow: 'Painel do SINE',
    description: 'Gerencie empresas, trabalhadores, vagas, currículos e relatórios.',
    email: 'gestor@sine.jacarezinho.cloud'
  }
}

export function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [selectedProfile, setSelectedProfile] = useState<AccessProfile>('staff')
  const [email, setEmail] = useState('gestor@sine.jacarezinho.cloud')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const selected = profiles[selectedProfile]

  useEffect(() => {
    getCurrentTenant().then(applyTenantTheme).catch(() => undefined)
  }, [])

  function chooseProfile(profile: AccessProfile) {
    setSelectedProfile(profile)
    setEmail(profiles[profile].email)
    setPassword('')
    setError('')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      setSession(data.user, data.tenant)
      navigate('/')
    } catch {
      setError('Não foi possível entrar com essas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#eef5f1] px-4 py-5 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-7xl flex-col overflow-hidden rounded-md border border-white/70 bg-white shadow-soft">
        <div className="grid flex-1 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative min-h-[420px] overflow-hidden p-6 text-white sm:p-9 lg:min-h-[680px]">
            <LoginNetworkCanvas />
            <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-between">
              <div>
                <div className="inline-flex rounded-md bg-white/94 p-3 shadow-lg">
                  <Logo className="h-20 w-64 object-contain" />
                </div>
                <div className="mt-10 max-w-xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/28">
                    <ShieldCheck size={16} />
                    Atendimento público com LGPD
                  </div>
                  <h1 className="text-4xl font-bold leading-tight sm:text-5xl">SINE Jacarezinho</h1>
                  <p className="mt-4 max-w-lg text-lg leading-8 text-white/88">Plataforma de Intermediação de Mão de Obra para conectar empresas, trabalhadores e colaboradores do SINE.</p>
                </div>
              </div>
              <div className="grid gap-3 text-sm text-white/90 sm:grid-cols-3">
                <div className="rounded-md bg-white/12 p-3 ring-1 ring-white/18">Vagas recebidas e acompanhadas</div>
                <div className="rounded-md bg-white/12 p-3 ring-1 ring-white/18">Currículos analisados com apoio de IA</div>
                <div className="rounded-md bg-white/12 p-3 ring-1 ring-white/18">Encaminhamentos auditáveis</div>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
            <div className="mb-6">
              <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Escolha seu acesso</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Entrar na plataforma</h2>
            </div>

            <div className="mb-6 grid gap-3">
              {(Object.entries(profiles) as Array<[AccessProfile, typeof profiles[AccessProfile]]>).map(([key, profile]) => {
                const Icon = profile.icon
                const active = selectedProfile === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => chooseProfile(key)}
                    className={`flex min-h-24 items-center gap-4 rounded-md border p-4 text-left transition ${active ? 'border-emerald-700 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'}`}
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${active ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon size={23} />
                    </span>
                    <span>
                      <span className="block text-base font-bold text-slate-950">{profile.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-slate-600">{profile.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <form onSubmit={submit} className="rounded-md border border-slate-200 bg-slate-50 p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-emerald-700">{selected.eyebrow}</div>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">{selected.title}</h3>
                </div>
                <button type="button" aria-label="Voltar para colaborador" className="rounded-md p-2 text-slate-500 hover:bg-white" onClick={() => chooseProfile('staff')}>
                  <ArrowLeft size={18} />
                </button>
              </div>
              <label className="mb-4 block">
                <span className="mb-1 block text-sm font-medium text-slate-700">E-mail</span>
                <span className="flex items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-emerald-700">
                  <Mail size={18} className="text-slate-400" />
                  <input className="h-11 w-full border-0 bg-transparent px-3 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                </span>
              </label>
              <label className="mb-4 block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Senha</span>
                <span className="flex items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-emerald-700">
                  <LockKeyhole size={18} className="text-slate-400" />
                  <input className="h-11 w-full border-0 bg-transparent px-3 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
                </span>
              </label>
              {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <button className="tenant-button h-11 w-full rounded-md font-semibold disabled:opacity-70" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
              {selectedProfile !== 'staff' && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400">Primeiro acesso</button>
                  <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400">Recuperar senha</button>
                </div>
              )}
              <p className="mt-5 text-xs leading-5 text-slate-500">Dados pessoais são tratados conforme LGPD e auditados por finalidade de atendimento público.</p>
            </form>
          </section>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-400 sm:px-8">
          <span>Prefeitura Municipal de Jacarezinho</span>
          <span className="inline-flex items-center gap-2 opacity-70">
            <span className="flex h-5 w-8 items-center justify-center rounded-sm border border-slate-300 text-[10px] font-black tracking-tight text-slate-500">JMB</span>
            <span className="font-medium">Tecnologia</span>
          </span>
        </footer>
      </div>
    </div>
  )
}
