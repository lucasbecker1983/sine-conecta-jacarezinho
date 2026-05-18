export type Tenant = {
  id: string
  name: string
  slug: string
  city: string
  state: string
  domain: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  footer_text: string
}

export type User = {
  id: string
  tenant_id?: string
  email: string
  full_name: string
  roles: string[]
}

export type Summary = Record<string, number>
