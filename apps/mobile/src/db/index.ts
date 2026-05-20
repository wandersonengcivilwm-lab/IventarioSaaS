import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { schema }     from './schema'
import { migrations } from './migrations'
import Category       from './models/Category'
import Warehouse      from './models/Warehouse'
import Product        from './models/Product'
import InventoryItem  from './models/InventoryItem'
import Transaction    from './models/Transaction'
import KanbanStage    from './models/KanbanStage'
import KanbanCard     from './models/KanbanCard'

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Setup error:', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [
    Category,
    Warehouse,
    Product,
    InventoryItem,
    Transaction,
    KanbanStage,
    KanbanCard,
  ],
})

export const categoriesCollection   = database.get<Category>('categories')
export const warehousesCollection   = database.get<Warehouse>('warehouses')
export const productsCollection     = database.get<Product>('products')
export const inventoryCollection    = database.get<InventoryItem>('inventory_items')
export const transactionsCollection = database.get<Transaction>('transactions')
export const kanbanStagesCollection = database.get<KanbanStage>('kanban_stages')
export const kanbanCardsCollection  = database.get<KanbanCard>('kanban_cards')
