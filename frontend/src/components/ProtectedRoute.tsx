import { Navigate, Outlet } from 'react-router-dom'

export function ProtectedRoute() {
  const hasSession = Boolean(localStorage.getItem('sine_access_token') || localStorage.getItem('sine_refresh_token'))
  return hasSession ? <Outlet /> : <Navigate to="/login" replace />
}
