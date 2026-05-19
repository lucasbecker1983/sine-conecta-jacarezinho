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
    email: 'empresa@sine.jacarezinho.cloud'
  },
  worker: {
    icon: UserRound,
    title: 'Sou Trabalhador',
    eyebrow: 'Portal do Trabalhador',
    description: 'Atualize seu cadastro, envie currículo e acompanhe encaminhamentos.',
    email: 'candidato@sine.jacarezinho.cloud'
  },
  staff: {
    icon: BriefcaseBusiness,
    title: 'Sou Colaborador',
    eyebrow: 'Painel do SINE',
    description: 'Gerencie empresas, trabalhadores, vagas, currículos e relatórios.',
    email: 'colaborador@sine.jacarezinho.cloud'
  }
}

export function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [selectedProfile, setSelectedProfile] = useState<AccessProfile>('staff')
  const [email, setEmail] = useState('colaborador@sine.jacarezinho.cloud')
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
    <div className="login-page min-h-screen bg-[#eef5f1] px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:h-screen lg:overflow-hidden">
      <div className="login-shell mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-7xl flex-col overflow-hidden rounded-md border border-white/70 bg-white shadow-soft lg:h-[calc(100vh-32px)] lg:min-h-0">
        <div className="grid min-h-0 flex-1 lg:grid-cols-[1.03fr_0.97fr]">
          <section className="login-hero relative min-h-[300px] overflow-hidden p-5 text-white sm:p-7 lg:min-h-0">
            <LoginNetworkCanvas />
            <div className="login-hero-content relative z-10 flex h-full min-h-[300px] flex-col justify-between lg:min-h-0">
              <div>
                <div className="inline-flex rounded-md bg-white/94 p-2 shadow-lg sm:p-2.5">
                  <Logo className="login-logo h-14 w-48 object-contain sm:h-20 sm:w-64" />
                </div>
                <div className="login-intro mt-7 max-w-xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/28">
                    <ShieldCheck size={16} />
                    Atendimento público com LGPD
                  </div>
                  <h1 className="text-3xl font-bold leading-tight sm:text-5xl">SINE Jacarezinho</h1>
                  <p className="login-copy mt-3 max-w-lg text-base leading-7 text-white/88 sm:text-lg">Plataforma de Intermediação de Mão de Obra para conectar empresas, trabalhadores e colaboradores do SINE.</p>
                </div>
              </div>
              <div className="login-badges grid gap-2 text-sm text-white/90 sm:grid-cols-3">
                <div className="rounded-md bg-white/12 p-3 ring-1 ring-white/18">Vagas recebidas e acompanhadas</div>
                <div className="rounded-md bg-white/12 p-3 ring-1 ring-white/18">Currículos analisados com apoio de IA</div>
                <div className="rounded-md bg-white/12 p-3 ring-1 ring-white/18">Encaminhamentos auditáveis</div>
              </div>
            </div>
          </section>

          <section className="login-panel flex min-h-0 flex-col justify-center overflow-hidden p-4 sm:p-6 lg:p-6 xl:p-7">
            <div className="login-heading mb-4">
              <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Escolha seu acesso</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Entrar na plataforma</h2>
            </div>

            <div className="login-profile-grid mb-4 grid gap-2.5">
              {(Object.entries(profiles) as Array<[AccessProfile, typeof profiles[AccessProfile]]>).map(([key, profile]) => {
                const Icon = profile.icon
                const active = selectedProfile === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => chooseProfile(key)}
                    className={`login-profile-card flex min-h-[76px] items-center gap-3 rounded-md border p-3 text-left transition ${active ? 'border-emerald-700 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'}`}
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${active ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon size={23} />
                    </span>
                    <span>
                      <span className="block text-base font-bold text-slate-950">{profile.title}</span>
                      <span className="login-profile-description mt-1 block text-sm leading-5 text-slate-600">{profile.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <form onSubmit={submit} className="login-form rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-emerald-700">{selected.eyebrow}</div>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">{selected.title}</h3>
                </div>
                <button type="button" aria-label="Voltar para colaborador" className="rounded-md p-2 text-slate-500 hover:bg-white" onClick={() => chooseProfile('staff')}>
                  <ArrowLeft size={18} />
                </button>
              </div>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-medium text-slate-700">E-mail</span>
                <span className="flex items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-emerald-700">
                  <Mail size={18} className="text-slate-400" />
                  <input className="h-11 w-full border-0 bg-transparent px-3 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                </span>
              </label>
              <label className="mb-3 block">
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
              <p className="login-lgpd mt-4 text-xs leading-5 text-slate-500">Dados pessoais são tratados conforme LGPD e auditados por finalidade de atendimento público.</p>
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
