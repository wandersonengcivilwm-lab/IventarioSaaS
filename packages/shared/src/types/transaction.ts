export type TransactionType =
  | 'entry'
  | 'exit'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out'

export interface Transaction {
  id: string
  tenant_id: string
  product_id: string
  warehouse_id: string
  user_id: string
  type: TransactionType
  quantity: number
  unit_cost: number | null
  reference: string | null
  notes: string | null
  scanned_via_qr: boolean
  created_at: string
  // joined
  product?: { name: string; unit: string }
  warehouse?: { name: string }
  user?: { full_name: string }
}

export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  type: 'low_stock' | 'transaction' | 'kanban_move' | 'mention' | 'system'
  title: string
  body: string
  data: Record<string, unknown>
  read_at: string | null
  sent_at: string | null
  created_at: string
}
