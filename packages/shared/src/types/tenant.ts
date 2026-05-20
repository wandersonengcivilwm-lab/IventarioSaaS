export type Plan = 'free' | 'pro' | 'enterprise'

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: Plan
  logo_url: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type UserRole = 'owner' | 'admin' | 'operator' | 'viewer'

export interface User {
  id: string
  tenant_id: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  push_token: string | null
  fcm_token: string | null
  last_seen_at: string | null
  created_at: string
  updated_at: string
}
