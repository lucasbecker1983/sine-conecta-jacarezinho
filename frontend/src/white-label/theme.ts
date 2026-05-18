import type { Tenant } from '../types'

export function applyTenantTheme(tenant: Tenant) {
  const root = document.documentElement
  root.style.setProperty('--tenant-primary', tenant.primary_color)
  root.style.setProperty('--tenant-secondary', tenant.secondary_color)
  root.style.setProperty('--tenant-accent', tenant.accent_color)
}
