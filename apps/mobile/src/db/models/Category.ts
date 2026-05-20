import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Category extends Model {
  static table = 'categories'

  @field('server_id')  serverId!:  string | null
  @field('tenant_id')  tenantId!:  string
  @field('name')       name!:      string
  @field('color')      color!:     string
  @field('icon')       icon!:      string | null
  @field('synced_at')  syncedAt!:  number | null
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
