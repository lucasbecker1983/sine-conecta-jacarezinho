import { useEffect, useState } from 'react'
import { BarChart3, Bell, BriefcaseBusiness, Building2, FileCheck2, FileText, LockKeyhole, LogOut, MessagesSquare, Settings, ShieldCheck, UserRound, UserRoundSearch, UsersRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api, getCurrentTenant } from '../services/api'
import { useAuthStore } from '../stores/auth'
import type { NotificationItem } from '../types'
import jmbLogo from '../assets/logos/jmb-tecnologia-logo.png'

const items = [
  { to: '/', label: 'Dashboard', icon: BarChart3, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff', 'company_user', 'worker'] },
  { to: '/empresa/cadastro', label: 'Meu cadastro', icon: FileCheck2, roles: ['company_user'] },
  { to: '/empresa/vagas', label: 'Minhas vagas', icon: BriefcaseBusiness, roles: ['company_user'] },
  { to: '/empresa/encaminhamentos', label: 'Candidatos', icon: UserRoundSearch, roles: ['company_user'] },
  { to: '/empresa/comunicacao', label: 'Comunicação', icon: MessagesSquare, roles: ['company_user'] },
  { to: '/meu-curriculo', label: 'Meu Currículo', icon: UserRound, roles: ['worker'] },
  { to: '/vagas-abertas', label: 'Vagas abertas', icon: BriefcaseBusiness, roles: ['worker'] },
  { to: '/empresas', label: 'Empresas', icon: Building2, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff'] },
  { to: '/trabalhadores', label: 'Trabalhadores', icon: UsersRound, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff'] },
  { to: '/curriculos', label: 'Curriculos', icon: FileText, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff'] },
  { to: '/vagas', label: 'Vagas', icon: BriefcaseBusiness, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff'] },
  { to: '/encaminhamentos', label: 'Encaminhamentos', icon: UserRoundSearch, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff', 'worker'] },
  { to: '/comunicacao', label: 'Comunicação', icon: MessagesSquare, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff'] },
  { to: '/auditoria-lgpd', label: 'Auditoria LGPD', icon: LockKeyhole, roles: ['super_admin', 'tenant_admin', 'sine_manager'] },
  { to: '/relatorios', label: 'Relatorios', icon: BarChart3, roles: ['super_admin', 'tenant_admin', 'sine_manager'] },
  { to: '/admin', label: 'White label', icon: Settings, roles: ['super_admin', 'tenant_admin'] },
  { to: '/master', label: 'Master SaaS', icon: ShieldCheck, roles: ['super_admin'] }
]

export function AppLayout() {
  const { user, tenant, logout, setSession } = useAuthStore()
  const navigate = useNavigate()
  const userRoles = user?.roles ?? []
  const visibleItems = items.filter((item) => item.roles.some((role) => userRoles.includes(role)))
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [openNotifications, setOpenNotifications] = useState(false)

  function refreshNotifications() {
    if (!localStorage.getItem('sine_access_token')) return
    Promise.all([api.get<{ unread: number }>('/notifications/summary'), api.get<NotificationItem[]>('/notifications')])
      .then(([summary, items]) => {
        setUnread(summary.data.unread)
        setNotifications(items.data)
      })
      .catch(() => {
        setUnread(0)
        setNotifications([])
      })
  }

  async function markNotificationsRead() {
    await api.post('/notifications/read-all').catch(() => undefined)
    refreshNotifications()
  }

  useEffect(() => {
    if (user || !localStorage.getItem('sine_access_token')) return
    Promise.all([api.get('/auth/me'), getCurrentTenant()])
      .then(([me, currentTenant]) => setSession(me.data, currentTenant))
      .catch(() => {
        logout()
        navigate('/login')
      })
  }, [logout, navigate, setSession, user])

  useEffect(() => {
    refreshNotifications()
    const timer = window.setInterval(refreshNotifications, 30000)
    return () => window.clearInterval(timer)
  }, [user?.id])

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">SaaS GovTech</div>
          <div className="mt-1 text-xl font-bold text-slate-950">{tenant?.name ?? 'SINE Jacarezinho'}</div>
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-emerald-50 text-emerald-900' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur">
          <div>
            <div className="text-sm font-semibold text-slate-950">{tenant?.city ?? 'Jacarezinho'} / {tenant?.state ?? 'PR'}</div>
            <div className="text-xs text-slate-500">A análise automática é apenas uma sugestão. A decisão final é do colaborador responsável.</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                aria-label="Notificações"
                className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setOpenNotifications((value) => !value)}
              >
                <Bell size={18} />
                {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-500 px-1 text-center text-[11px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {openNotifications && (
                <div className="absolute right-0 z-30 mt-2 w-[360px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div className="text-sm font-bold text-slate-950">Notificações</div>
                    <button className="text-xs font-semibold text-emerald-800" onClick={markNotificationsRead}>Marcar lidas</button>
                  </div>
                  <div className="max-h-96 overflow-auto">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`border-b border-slate-100 p-4 ${notification.read_at ? 'bg-white' : 'bg-emerald-50/70'}`}>
                        <div className="text-sm font-semibold text-slate-950">{notification.title}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-600">{notification.message}</div>
                        <div className="mt-2 text-[11px] text-slate-400">{new Date(notification.created_at).toLocaleString('pt-BR')}</div>
                      </div>
                    ))}
                    {notifications.length === 0 && <div className="p-4 text-sm text-slate-500">Nenhuma notificação no momento.</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">{user?.full_name ?? 'Usuário'}</div>
              <div className="text-xs text-slate-500">{user?.roles?.join(', ')}</div>
            </div>
            <button aria-label="Sair" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => { logout(); navigate('/login') }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="p-5">
          <Outlet />
        </div>
        <footer className="px-5 pb-6">
          <div className="flex items-center justify-center border-t border-slate-200/80 pt-4 text-[11px] text-slate-400">
            <span>Desenvolvido por</span>
            <a
              href="https://jmbtenologia.com.br"
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir site da JMB Tecnologia"
              className="ml-2 inline-flex opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <img src={jmbLogo} alt="JMB Tecnologia" className="h-5 w-auto object-contain" />
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
