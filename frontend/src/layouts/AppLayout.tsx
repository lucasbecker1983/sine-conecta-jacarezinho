import { BarChart3, BriefcaseBusiness, Building2, FileText, LogOut, Settings, ShieldCheck, UserRoundSearch, UsersRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

const items = [
  { to: '/', label: 'Dashboard', icon: BarChart3, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff', 'company_user', 'worker'] },
  { to: '/empresas', label: 'Empresas', icon: Building2, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff'] },
  { to: '/trabalhadores', label: 'Trabalhadores', icon: UsersRound, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff'] },
  { to: '/curriculos', label: 'Curriculos', icon: FileText, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff', 'worker'] },
  { to: '/vagas', label: 'Vagas', icon: BriefcaseBusiness, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff', 'company_user'] },
  { to: '/encaminhamentos', label: 'Encaminhamentos', icon: UserRoundSearch, roles: ['super_admin', 'tenant_admin', 'sine_manager', 'sine_staff', 'company_user', 'worker'] },
  { to: '/relatorios', label: 'Relatorios', icon: BarChart3, roles: ['super_admin', 'tenant_admin', 'sine_manager'] },
  { to: '/admin', label: 'White label', icon: Settings, roles: ['super_admin', 'tenant_admin'] },
  { to: '/master', label: 'Master SaaS', icon: ShieldCheck, roles: ['super_admin'] }
]

export function AppLayout() {
  const { user, tenant, logout } = useAuthStore()
  const navigate = useNavigate()
  const userRoles = user?.roles ?? []
  const visibleItems = items.filter((item) => item.roles.some((role) => userRoles.includes(role)))
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
      </main>
    </div>
  )
}
