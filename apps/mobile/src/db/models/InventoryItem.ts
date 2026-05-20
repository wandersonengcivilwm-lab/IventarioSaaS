import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class InventoryItem extends Model {
  static table = 'inventory_items'

  @field('server_id')    serverId!:    string | null
  @field('tenant_id')    tenantId!:    string
  @field('product_id')   productId!:   string
  @field('warehouse_id') warehouseId!: string
  @field('quantity')     quantity!:    number
  @field('reserved_qty') reservedQty!: number
  @field('synced_at')    syncedAt!:    number | null
  @readonly @date('updated_at') updatedAt!: Date
}
