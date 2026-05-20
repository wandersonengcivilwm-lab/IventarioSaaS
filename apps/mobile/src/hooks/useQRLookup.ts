import { useState, useCallback } from 'react'
import { Q } from '@nozbe/watermelondb'
import { parseQRPayload } from '../components/scanner/QRScanner'
import { productsCollection, database } from '../db'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store/authStore'
import Product from '../db/models/Product'

type LookupResult =
  | { status: 'found';     product: Product }
  | { status: 'notFound';  raw: string }
  | { status: 'loading' }
  | { status: 'idle' }

export function useQRLookup() {
  const tenantId = useAuthStore(s => s.tenantId)
  const [result, setResult] = useState<LookupResult>({ status: 'idle' })

  const lookup = useCallback(async (raw: string) => {
    setResult({ status: 'loading' })

    const parsed = parseQRPayload(raw)
    const searchId = parsed.type === 'product' ? parsed.serverId : null

    // 1. Tenta no cache local por server_id
    if (searchId) {
      const local = await productsCollection
        .query(Q.where('server_id', searchId))
        .fetch()
      if (local.length > 0) {
        setResult({ status: 'found', product: local[0] })
        return
      }
    }

    // 2. Tenta no cache local por qr_code (raw)
    const byQR = await productsCollection
      .query(Q.where('qr_code', raw))
      .fetch()
    if (byQR.length > 0) {
      setResult({ status: 'found', product: byQR[0] })
      return
    }

    // 3. Fallback: busca no Supabase (produto ainda não sincronizado localmente)
    if (tenantId) {
      const query = searchId
        ? supabase.from('products').select('*').eq('id', searchId).eq('tenant_id', tenantId).single()
        : supabase.from('products').select('*').eq('qr_code', raw).eq('tenant_id', tenantId).single()

      const { data, error } = await query
      if (!error && data) {
        // Insere no cache local para próximas consultas
        let localProduct: Product | null = null
        await database.write(async () => {
          localProduct = await productsCollection.create(r => {
            r.serverId    = data.id
            r.tenantId    = data.tenant_id
            r.categoryId  = data.category_id
            r.name        = data.name
            r.sku         = data.sku
            r.qrCode      = data.qr_code
            r.description = data.description
            r.unit        = data.unit
            r.costPrice   = data.cost_price
            r.salePrice   = data.sale_price
            r.minStock    = data.min_stock
            r.imageUrl    = data.image_url
            r.isActive    = data.is_active
            r.syncedAt    = Date.now()
          })
        })
        if (localProduct) {
          setResult({ status: 'found', product: localProduct })
          return
        }
      }
    }

    setResult({ status: 'notFound', raw })
  }, [tenantId])

  function reset() {
    setResult({ status: 'idle' })
  }

  return { result, lookup, reset }
}
