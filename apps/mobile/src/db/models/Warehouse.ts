import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Warehouse extends Model {
  static table = 'warehouses'

  @field('server_id')  serverId!:  string | null
  @field('tenant_id')  tenantId!:  string
  @field('name')       name!:      string
  @field('location')   location!:  string | null
  @field('is_default') isDefault!: boolean
  @field('synced_at')  syncedAt!:  number | null
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
