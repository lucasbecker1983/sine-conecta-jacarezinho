import { Navigate, Outlet } from 'react-router-dom'

export function ProtectedRoute() {
  return localStorage.getItem('sine_access_token') ? <Outlet /> : <Navigate to="/login" replace />
}
