import { create } from 'zustand'
import type { Tenant, User } from '../types'

type AuthState = {
  user: User | null
  tenant: Tenant | null
  setSession: (user: User, tenant: Tenant | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  setSession: (user, tenant) => set({ user, tenant }),
  logout: () => {
    localStorage.removeItem('sine_access_token')
    localStorage.removeItem('sine_refresh_token')
    set({ user: null, tenant: null })
  }
}))
