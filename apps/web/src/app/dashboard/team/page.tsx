import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamActions } from './TeamActions'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: currentProfile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!currentProfile) redirect('/auth/login')

  // Busca todos os membros do tenant com email da auth.users via view
  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, role, is_active, last_seen_at')
    .eq('tenant_id', currentProfile.tenant_id)
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })

  // Enriquece com emails da auth (via admin API — server-side only)
  // Em produção: criar uma DB view users_with_email ou usar auth.users join
  const enrichedMembers = (members ?? []).map(m => ({
    ...m,
    auth_email: undefined as string | undefined,
  }))

  return (
    <div className="p-8 max-w-5xl">
      <TeamActions
        members={enrichedMembers as any}
        currentUserId={user.id}
        currentRole={currentProfile.role as any}
      />
    </div>
  )
}
