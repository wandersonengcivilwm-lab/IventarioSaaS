import { Q } from '@nozbe/watermelondb'
import { MMKV } from 'react-native-mmkv'
import { supabase } from './supabase'
import { buildQRPayload } from '../components/scanner/QRScanner'
import {
  database,
  categoriesCollection,
  warehousesCollection,
  productsCollection,
  inventoryCollection,
  transactionsCollection,
  kanbanStagesCollection,
  kanbanCardsCollection,
} from '../db'
import Category     from '../db/models/Category'
import Warehouse    from '../db/models/Warehouse'
import Product      from '../db/models/Product'
import InventoryItem from '../db/models/InventoryItem'
import Transaction  from '../db/models/Transaction'
import KanbanStage  from '../db/models/KanbanStage'
import KanbanCard   from '../db/models/KanbanCard'

const storage = new MMKV({ id: 'sync-storage' })
const LAST_SYNC_KEY = 'last_synced_at'

function getLastSync(): string {
  return storage.getString(LAST_SYNC_KEY) ?? '1970-01-01T00:00:00Z'
}

function setLastSync(timestamp: string) {
  storage.set(LAST_SYNC_KEY, timestamp)
}

// ─── PULL: servidor → local ───────────────────────────────────
async function pullFromServer(tenantId: string) {
  const since = getLastSync()

  const [cats, warehouses, products, inventory] = await Promise.all([
    supabase.from('categories').select('*').eq('tenant_id', tenantId).gt('updated_at', since),
    supabase.from('warehouses').select('*').eq('tenant_id', tenantId).gt('updated_at', since),
    supabase.from('products').select('*').eq('tenant_id', tenantId).gt('updated_at', since),
    supabase.from('inventory_items').select('*').eq('tenant_id', tenantId).gt('updated_at', since),
  ])

  await database.write(async () => {
    // Categories
    for (const row of cats.data ?? []) {
      const existing = await categoriesCollection
        .query(Q.where('server_id', row.id))
        .fetch()
      if (existing.length > 0) {
        await existing[0].update(r => {
          r.name      = row.name
          r.color     = row.color
          r.icon      = row.icon
          r.syncedAt  = Date.now()
        })
      } else {
        await categoriesCollection.create(r => {
          r.serverId  = row.id
          r.tenantId  = row.tenant_id
          r.name      = row.name
          r.color     = row.color
          r.icon      = row.icon
          r.syncedAt  = Date.now()
        })
      }
    }

    // Warehouses
    for (const row of warehouses.data ?? []) {
      const existing = await warehousesCollection
        .query(Q.where('server_id', row.id))
        .fetch()
      if (existing.length > 0) {
        await existing[0].update(r => {
          r.name      = row.name
          r.location  = row.location
          r.isDefault = row.is_default
          r.syncedAt  = Date.now()
        })
      } else {
        await warehousesCollection.create(r => {
          r.serverId  = row.id
          r.tenantId  = row.tenant_id
          r.name      = row.name
          r.location  = row.location
          r.isDefault = row.is_default
          r.syncedAt  = Date.now()
        })
      }
    }

    // Products
    for (const row of products.data ?? []) {
      const existing = await productsCollection
        .query(Q.where('server_id', row.id))
        .fetch()
      if (existing.length > 0) {
        await existing[0].update(r => {
          r.name        = row.name
          r.sku         = row.sku
          r.qrCode      = row.qr_code
          r.description = row.description
          r.unit        = row.unit
          r.costPrice   = row.cost_price
          r.salePrice   = row.sale_price
          r.minStock    = row.min_stock
          r.imageUrl    = row.image_url
          r.isActive    = row.is_active
          r.categoryId  = row.category_id
          r.syncedAt    = Date.now()
        })
      } else {
        await productsCollection.create(r => {
          r.serverId    = row.id
          r.tenantId    = row.tenant_id
          r.categoryId  = row.category_id
          r.name        = row.name
          r.sku         = row.sku
          r.qrCode      = row.qr_code
          r.description = row.description
          r.unit        = row.unit
          r.costPrice   = row.cost_price
          r.salePrice   = row.sale_price
          r.minStock    = row.min_stock
          r.imageUrl    = row.image_url
          r.isActive    = row.is_active
          r.syncedAt    = Date.now()
        })
      }
    }

    // Inventory items
    for (const row of inventory.data ?? []) {
      const existing = await inventoryCollection
        .query(Q.where('server_id', row.id))
        .fetch()
      if (existing.length > 0) {
        await existing[0].update(r => {
          r.quantity    = row.quantity
          r.reservedQty = row.reserved_qty
          r.syncedAt    = Date.now()
        })
      } else {
        await inventoryCollection.create(r => {
          r.serverId    = row.id
          r.tenantId    = row.tenant_id
          r.productId   = row.product_id
          r.warehouseId = row.warehouse_id
          r.quantity    = row.quantity
          r.reservedQty = row.reserved_qty
          r.syncedAt    = Date.now()
        })
      }
    }
  })
}

// ─── PUSH: local pendente → servidor ─────────────────────────
async function pushPending(userId: string) {
  const pending = await transactionsCollection
    .query(Q.where('synced', false))
    .fetch()

  for (const tx of pending) {
    // Resolver server_id do produto e depósito a partir do local
    const [localProduct] = await productsCollection
      .query(Q.where('id', tx.productId))
      .fetch()
    const [localWarehouse] = await warehousesCollection
      .query(Q.where('id', tx.warehouseId))
      .fetch()

    if (!localProduct?.serverId || !localWarehouse?.serverId) continue

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        tenant_id:      tx.tenantId,
        product_id:     localProduct.serverId,
        warehouse_id:   localWarehouse.serverId,
        user_id:        userId,
        type:           tx.type,
        quantity:       tx.quantity,
        unit_cost:      tx.unitCost,
        reference:      tx.reference,
        notes:          tx.notes,
        scanned_via_qr: tx.scannedViaQr,
      })
      .select()
      .single()

    if (!error && data) {
      await tx.markSynced(data.id)
    }
  }
}

// ─── PUSH: produto novo criado offline ───────────────────────
export async function pushNewProduct(localId: string) {
  const [local] = await productsCollection
    .query(Q.where('id', localId))
    .fetch()
  if (!local || local.serverId) return // já sincronizado

  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id:   local.tenantId,
      category_id: local.categoryId,
      name:        local.name,
      sku:         local.sku,
      description: local.description,
      unit:        local.unit,
      cost_price:  local.costPrice,
      sale_price:  local.salePrice,
      min_stock:   local.minStock,
      is_active:   local.isActive,
    })
    .select()
    .single()

  if (!error && data) {
    // Gera o payload QR e atualiza o produto no servidor
    const qrPayload = buildQRPayload(data.id)
    await supabase
      .from('products')
      .update({ qr_code: qrPayload })
      .eq('id', data.id)

    await database.write(async () => {
      await local.update(r => {
        r.serverId = data.id
        r.qrCode   = qrPayload
        r.syncedAt = Date.now()
      })
    })
  }
}

// ─── SYNC completo ────────────────────────────────────────────
export async function syncAll(tenantId: string, userId: string) {
  try {
    await pullFromServer(tenantId)
    await pushPending(userId)
    await pushPendingKanbanCards(tenantId)
    setLastSync(new Date().toISOString())
    console.log('[Sync] Completo:', new Date().toISOString())
  } catch (err) {
    console.error('[Sync] Erro:', err)
  }
}

// ─── PUSH: kanban cards pendentes → servidor ──────────────────
async function pushPendingKanbanCards(tenantId: string) {
  const pending = await kanbanCardsCollection
    .query(Q.where('synced', false))
    .fetch()

  for (const card of pending) {
    if (!card.stageServerId) continue

    if (card.serverId) {
      // Atualizar card existente (movido entre colunas)
      const { error } = await supabase
        .from('kanban_cards')
        .update({ stage_id: card.stageServerId, position: card.position })
        .eq('id', card.serverId)

      if (!error) {
        await database.write(async () => {
          await card.update(r => { r.synced = true; r.syncedAt = Date.now() })
        })
      }
    } else {
      // Novo card criado offline
      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          tenant_id:   tenantId,
          stage_id:    card.stageServerId,
          title:       card.title,
          description: card.description,
          priority:    card.priority,
          position:    card.position,
          due_date:    card.dueDate,
        })
        .select()
        .single()

      if (!error && data) {
        await card.markSynced(data.id)
      }
    }
  }
}

export function resetSyncTimestamp() {
  storage.delete(LAST_SYNC_KEY)
}
