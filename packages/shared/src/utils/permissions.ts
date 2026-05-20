import type { UserRole } from '../types/tenant'

type Action =
  | 'create_product'
  | 'edit_product'
  | 'delete_product'
  | 'record_transaction'
  | 'manage_team'
  | 'export_report'
  | 'manage_settings'
  | 'view_analytics'
  | 'manage_kanban'

const PERMISSIONS: Record<Action, UserRole[]> = {
  create_product:      ['owner', 'admin', 'operator'],
  edit_product:        ['owner', 'admin', 'operator'],
  delete_product:      ['owner', 'admin'],
  record_transaction:  ['owner', 'admin', 'operator'],
  manage_team:         ['owner', 'admin'],
  export_report:       ['owner', 'admin'],
  manage_settings:     ['owner'],
  view_analytics:      ['owner', 'admin', 'operator', 'viewer'],
  manage_kanban:       ['owner', 'admin', 'operator'],
}

export function can(role: UserRole, action: Action): boolean {
  return PERMISSIONS[action].includes(role)
}

export function requireRole(role: UserRole, minRole: UserRole): boolean {
  const hierarchy: UserRole[] = ['viewer', 'operator', 'admin', 'owner']
  return hierarchy.indexOf(role) >= hierarchy.indexOf(minRole)
}
