import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, writer } from '@nozbe/watermelondb/decorators'

export default class KanbanCard extends Model {
  static table = 'kanban_cards'

  @field('server_id')       serverId!:      string | null
  @field('tenant_id')       tenantId!:      string
  @field('stage_id')        stageId!:       string
  @field('stage_server_id') stageServerId!: string | null
  @field('product_id')      productId!:     string | null
  @field('title')           title!:         string
  @field('description')     description!:   string | null
  @field('quantity')        quantity!:      number | null
  @field('priority')        priority!:      string
  @field('due_date')        dueDate!:       string | null
  @field('assignee_id')     assigneeId!:    string | null
  @field('position')        position!:      number
  @field('synced')          synced!:        boolean
  @field('synced_at')       syncedAt!:      number | null
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date

  @writer async moveToStage(localStageId: string, stageServerId: string | null, newPosition: number) {
    await this.update(r => {
      r.stageId       = localStageId
      r.stageServerId = stageServerId
      r.position      = newPosition
      r.synced        = false
    })
  }

  @writer async markSynced(serverId: string) {
    await this.update(r => {
      r.synced   = true
      r.serverId = serverId
      r.syncedAt = Date.now()
    })
  }
}
