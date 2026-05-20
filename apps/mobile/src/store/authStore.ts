import { create } from 'zustand'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import type { User, UserRole } from '@inventory-saas/shared'

interface AuthState {
  session: Session | null
  supabaseUser: SupabaseUser | null
  profile: User | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  tenantId: string | null
  role: UserRole | null
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  supabaseUser: null,
  profile: null,
  isLoading: true,

  get tenantId() {
    return get().profile?.tenant_id ?? null
  },

  get role() {
    return get().profile?.role ?? null
  },

  setSession: (session) =>
    set({
      session,
      supabaseUser: session?.user ?? null,
    }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: () => set({ session: null, supabaseUser: null, profile: null }),
}))
