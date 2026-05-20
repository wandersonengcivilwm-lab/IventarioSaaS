import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class KanbanStage extends Model {
  static table = 'kanban_stages'

  @field('server_id')  serverId!:   string | null
  @field('tenant_id')  tenantId!:   string
  @field('name')       name!:       string
  @field('color')      color!:      string
  @field('position')   position!:   number
  @field('is_terminal') isTerminal!: boolean
  @field('synced_at')  syncedAt!:   number | null
  @readonly @date('created_at') createdAt!: Date
}
