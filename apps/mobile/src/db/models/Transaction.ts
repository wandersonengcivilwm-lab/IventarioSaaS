import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, writer } from '@nozbe/watermelondb/decorators'

export default class Transaction extends Model {
  static table = 'transactions'

  @field('server_id')       serverId!:     string | null
  @field('tenant_id')       tenantId!:     string
  @field('product_id')      productId!:    string
  @field('warehouse_id')    warehouseId!:  string
  @field('type')            type!:         string
  @field('quantity')        quantity!:     number
  @field('unit_cost')       unitCost!:     number | null
  @field('reference')       reference!:    string | null
  @field('notes')           notes!:        string | null
  @field('scanned_via_qr')  scannedViaQr!: boolean
  @field('synced')          synced!:       boolean
  @readonly @date('created_at') createdAt!: Date

  @writer async markSynced(serverId: string) {
    await this.update(record => {
      record.synced    = true
      record.serverId  = serverId
    })
  }
}
