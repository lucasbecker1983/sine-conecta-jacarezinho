import axios from 'axios'
import type { Tenant, User } from '../types'

export const api = axios.create({
  baseURL: '/api'
})

let refreshPromise: Promise<{ access_token: string; refresh_token: string; user: User; tenant: Tenant | null }> | null = null

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sine_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const url = originalRequest?.url ?? ''

    if (status !== 401 || originalRequest?._retry || url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('sine_refresh_token')
    if (!refreshToken) return Promise.reject(error)

    originalRequest._retry = true
    try {
      refreshPromise ??= api.post<{ access_token: string; refresh_token: string; user: User; tenant: Tenant | null }>('/auth/refresh', { refresh_token: refreshToken })
        .then(({ data }) => {
          localStorage.setItem('sine_access_token', data.access_token)
          localStorage.setItem('sine_refresh_token', data.refresh_token)
          return data
        })
        .finally(() => {
          refreshPromise = null
        })
      const session = await refreshPromise
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${session.access_token}`
      return api(originalRequest)
    } catch (refreshError) {
      localStorage.removeItem('sine_access_token')
      localStorage.removeItem('sine_refresh_token')
      return Promise.reject(refreshError)
    }
  }
)

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
