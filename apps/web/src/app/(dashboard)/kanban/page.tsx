import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KanbanWebBoard } from './KanbanWebBoard'

export default async function KanbanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const [stagesRes, cardsRes] = await Promise.all([
    supabase
      .from('kanban_stages')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('position', { ascending: true }),
    supabase
      .from('kanban_cards')
      .select('*, products(name, unit), users!kanban_cards_assignee_id_fkey(full_name)')
      .eq('tenant_id', profile.tenant_id)
      .order('position', { ascending: true }),
  ])

  const stages = stagesRes.data ?? []
  const cards  = cardsRes.data ?? []

  // Agrupa cards por stage_id
  const cardsByStage: Record<string, typeof cards> = {}
  for (const stage of stages) {
    cardsByStage[stage.id] = cards.filter(c => c.stage_id === stage.id)
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1C2E]">Kanban</h1>
        <p className="text-[#6B7280] mt-1">
          {stages.length} colunas • {cards.length} cards
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <KanbanWebBoard
          stages={stages}
          cardsByStage={cardsByStage}
          tenantId={profile.tenant_id}
          userRole={profile.role}
        />
      </div>
    </div>
  )
}
