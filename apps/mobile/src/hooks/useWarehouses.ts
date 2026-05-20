import { useState, useEffect } from 'react'
import { Q } from '@nozbe/watermelondb'
import { warehousesCollection } from '../db'
import Warehouse from '../db/models/Warehouse'
import { useAuthStore } from '../store/authStore'

export function useWarehouses() {
  const tenantId = useAuthStore(s => s.tenantId)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading]       = useState(true)
  const [defaultWarehouse, setDefaultWarehouse] = useState<Warehouse | null>(null)

  useEffect(() => {
    if (!tenantId) return

    const subscription = warehousesCollection
      .query(Q.where('tenant_id', tenantId))
      .observe()
      .subscribe(results => {
        setWarehouses(results)
        setDefaultWarehouse(results.find(w => w.isDefault) ?? results[0] ?? null)
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [tenantId])

  return { warehouses, defaultWarehouse, loading }
}
