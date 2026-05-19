import { FormEvent, useEffect, useState } from 'react'
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'
import type { User } from '../types'

export function ProfilePage() {
  const { user, setSession, tenant } = useAuthStore()
  const [profile, setProfile] = useState<User | null>(user)
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<User>('/profile/me').then(({ data }) => {
      setProfile(data)
      setFullName(data.full_name)
    }).catch(() => undefined)
  }, [])

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      const { data } = await api.patch<User>('/profile/me', { full_name: fullName })
      setProfile(data)
      setSession(data, tenant)
      setMessage('Perfil atualizado com sucesso.')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível atualizar o perfil.')
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await api.post('/profile/change-password', passwords)
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      setMessage('Senha alterada com segurança.')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível alterar a senha.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Meu perfil</h1>
        <p className="mt-1 text-sm text-slate-600">Dados da conta, segurança e identificação usada nos registros de auditoria.</p>
      </div>
      {(message || error) && <div className={`rounded-md border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{error || message}</div>}
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={saveProfile} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <UserRound className="text-emerald-700" size={24} />
          <h2 className="mt-3 text-lg font-bold text-slate-950">Dados da conta</h2>
          <label className="mt-4 block text-sm font-medium text-slate-700">Nome completo<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
          <label className="mt-3 block text-sm font-medium text-slate-700">E-mail<input disabled value={profile?.email ?? ''} className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500" /></label>
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600"><ShieldCheck size={16} className="mr-1 inline text-emerald-700" /> Perfil ativo: {profile?.roles.join(', ')}</div>
          <button className="tenant-button mt-4 rounded-md px-4 py-2 text-sm font-semibold">Salvar perfil</button>
        </form>
        <form onSubmit={changePassword} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <KeyRound className="text-emerald-700" size={24} />
          <h2 className="mt-3 text-lg font-bold text-slate-950">Alterar senha</h2>
          <p className="mt-1 text-sm text-slate-600">Use uma senha forte, com letras, números e símbolos.</p>
          <div className="mt-4 grid gap-3">
            <input required type="password" placeholder="Senha atual" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2" />
            <input required type="password" placeholder="Nova senha" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2" />
            <input required type="password" placeholder="Confirmar nova senha" value={passwords.confirm_password} onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2" />
          </div>
          <button className="tenant-button mt-4 rounded-md px-4 py-2 text-sm font-semibold">Alterar senha</button>
        </form>
      </div>
    </div>
  )
}
