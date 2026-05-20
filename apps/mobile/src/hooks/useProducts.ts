import { useState, useEffect } from 'react'
import { Q } from '@nozbe/watermelondb'
import { productsCollection, inventoryCollection } from '../db'
import Product from '../db/models/Product'
import { useAuthStore } from '../store/authStore'

export function useProducts(searchQuery?: string) {
  const tenantId = useAuthStore(s => s.tenantId)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!tenantId) return

    const query = searchQuery?.trim()
    const conditions = [Q.where('tenant_id', tenantId), Q.where('is_active', true)]
    if (query) {
      conditions.push(
        Q.or(
          Q.where('name', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
          Q.where('sku',  Q.like(`%${Q.sanitizeLikeString(query)}%`)),
        )
      )
    }

    const subscription = productsCollection
      .query(...conditions)
      .observe()
      .subscribe(results => {
        setProducts(results)
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [tenantId, searchQuery])

  return { products, loading }
}

export function useProductById(localId: string) {
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    const subscription = productsCollection
      .findAndObserve(localId)
      .subscribe(p => setProduct(p))
    return () => subscription.unsubscribe()
  }, [localId])

  return product
}

export function useProductStock(productServerId: string | null, warehouseServerId: string | null) {
  const [quantity, setQuantity] = useState<number>(0)

  useEffect(() => {
    if (!productServerId || !warehouseServerId) return

    const subscription = inventoryCollection
      .query(
        Q.where('product_id',   productServerId),
        Q.where('warehouse_id', warehouseServerId),
      )
      .observe()
      .subscribe(items => {
        setQuantity(items[0]?.quantity ?? 0)
      })

    return () => subscription.unsubscribe()
  }, [productServerId, warehouseServerId])

  return quantity
}
