import { FormEvent, useEffect, useState } from 'react'
import { KeyRound, Plus, ShieldCheck, UserCog } from 'lucide-react'
import { api } from '../services/api'
import type { SineCollaborator } from '../types'

const roles = ['sine_staff', 'sine_manager', 'tenant_admin']

export function CollaboratorsPage() {
  const [items, setItems] = useState<SineCollaborator[]>([])
  const [form, setForm] = useState({ email: '', full_name: '', role: 'sine_staff', is_active: true })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function refresh() {
    api.get<SineCollaborator[]>('/users/sine-collaborators').then(({ data }) => setItems(data)).catch(() => setItems([]))
  }

  useEffect(() => refresh(), [])

  async function create(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      const { data } = await api.post('/users/sine-collaborators', form)
      setMessage(`Colaborador criado. Senha temporária: ${data.temporary_password}`)
      setForm({ email: '', full_name: '', role: 'sine_staff', is_active: true })
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Não foi possível criar colaborador.')
    }
  }

  async function patch(id: string, payload: Partial<SineCollaborator> & { role?: string }) {
    await api.patch(`/users/sine-collaborators/${id}`, payload).catch((err) => setError(err.response?.data?.detail ?? 'Não foi possível atualizar colaborador.'))
    refresh()
  }

  async function resetPassword(id: string) {
    const { data } = await api.post(`/users/sine-collaborators/${id}/reset-password`)
    setMessage(`Senha temporária: ${data.temporary_password}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Colaboradores do SINE</h1>
        <p className="mt-1 text-sm text-slate-600">Gestão de acessos internos. Empresas e trabalhadores nunca criam usuários do SINE.</p>
      </div>
      {(message || error) && <div className={`rounded-md border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{error || message}</div>}
      <form onSubmit={create} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3"><UserCog className="text-emerald-700" /><div><h2 className="font-bold text-slate-950">Novo colaborador</h2><p className="text-sm text-slate-600">Crie acesso com senha temporária e perfil operacional.</p></div></div>
        <div className="grid gap-3 md:grid-cols-4">
          <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2" />
          <input required placeholder="Nome completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2">{roles.map((role) => <option key={role}>{role}</option>)}</select>
          <button className="tenant-button inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"><Plus size={17} /> Criar</button>
        </div>
      </form>
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3"><div className="font-semibold text-slate-950">{item.full_name}</div><div className="text-xs text-slate-500">{item.email}</div></td>
                <td className="px-4 py-3"><select value={item.roles.find((role) => roles.includes(role)) ?? 'sine_staff'} onChange={(e) => patch(item.id, { role: e.target.value })} className="rounded-md border border-slate-200 px-2 py-1">{roles.map((role) => <option key={role}>{role}</option>)}</select></td>
                <td className="px-4 py-3"><button onClick={() => patch(item.id, { is_active: !item.is_active })} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}><ShieldCheck size={13} className="mr-1 inline" /> {item.is_active ? 'Ativo' : 'Inativo'}</button></td>
                <td className="px-4 py-3"><button onClick={() => resetPassword(item.id)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400"><KeyRound size={14} /> Redefinir senha</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhum colaborador cadastrado.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}
