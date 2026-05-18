import axios from 'axios'
import type { Tenant, User } from '../types'

export const api = axios.create({
  baseURL: '/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sine_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function getCurrentTenant() {
  const { data } = await api.get<Tenant>('/tenants/current')
  return data
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ access_token: string; refresh_token: string; user: User; tenant: Tenant | null }>('/auth/login', { email, password })
  localStorage.setItem('sine_access_token', data.access_token)
  localStorage.setItem('sine_refresh_token', data.refresh_token)
  return data
}
