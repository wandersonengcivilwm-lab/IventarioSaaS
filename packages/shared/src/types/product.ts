export type ProductUnit = 'un' | 'kg' | 'g' | 'l' | 'ml' | 'm' | 'cx' | 'pct'

export interface Category {
  id: string
  tenant_id: string
  name: string
  color: string
  icon: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  sku: string | null
  barcode: string | null
  qr_code: string | null
  description: string | null
  unit: ProductUnit
  cost_price: number | null
  sale_price: number | null
  min_stock: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  category?: Category | null
}

export interface Warehouse {
  id: string
  tenant_id: string
  name: string
  location: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  tenant_id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_qty: number
  updated_at: string
  // joined
  product?: Product
  warehouse?: Warehouse
}
