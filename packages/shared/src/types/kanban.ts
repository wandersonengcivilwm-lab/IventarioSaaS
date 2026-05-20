export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface KanbanStage {
  id: string
  tenant_id: string
  name: string
  color: string
  position: number
  is_terminal: boolean
  created_at: string
}

export interface KanbanCard {
  id: string
  tenant_id: string
  stage_id: string
  product_id: string | null
  title: string
  description: string | null
  quantity: number | null
  priority: KanbanPriority
  due_date: string | null
  assignee_id: string | null
  position: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // joined
  assignee?: { full_name: string; avatar_url: string | null }
  product?: { name: string; unit: string }
}

export interface KanbanBoard {
  stages: (KanbanStage & { cards: KanbanCard[] })[]
}
