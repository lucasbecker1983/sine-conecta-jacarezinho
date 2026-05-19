import { Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useAuthStore } from '../stores/auth'

type Props = {
  allowedRoles: string[]
  children: ReactElement
}

export function AuthorizedRoute({ allowedRoles, children }: Props) {
  const user = useAuthStore((state) => state.user)
  const roles = user?.roles ?? []

  if (!user) {
    return <div className="p-6 text-sm font-medium text-slate-600">Validando acesso...</div>
  }

  const authorized = roles.includes('super_admin') || allowedRoles.some((role) => roles.includes(role))
  return authorized ? children : <Navigate to="/" replace />
}
