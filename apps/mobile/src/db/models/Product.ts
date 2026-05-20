import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
  static table = 'products'

  @field('server_id')   serverId!:    string | null
  @field('tenant_id')   tenantId!:    string
  @field('category_id') categoryId!:  string | null
  @field('name')        name!:        string
  @field('sku')         sku!:         string | null
  @field('qr_code')     qrCode!:      string | null
  @field('description') description!: string | null
  @field('unit')        unit!:        string
  @field('cost_price')  costPrice!:   number | null
  @field('sale_price')  salePrice!:   number | null
  @field('min_stock')   minStock!:    number
  @field('image_url')   imageUrl!:    string | null
  @field('is_active')   isActive!:    boolean
  @field('synced_at')   syncedAt!:    number | null
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
