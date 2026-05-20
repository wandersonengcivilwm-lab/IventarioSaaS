import { useState, useEffect } from 'react'
import { Q } from '@nozbe/watermelondb'
import { categoriesCollection } from '../db'
import Category from '../db/models/Category'
import { useAuthStore } from '../store/authStore'

export function useCategories() {
  const tenantId = useAuthStore(s => s.tenantId)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!tenantId) return

    const subscription = categoriesCollection
      .query(Q.where('tenant_id', tenantId), Q.sortBy('name', Q.asc))
      .observe()
      .subscribe(results => {
        setCategories(results)
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [tenantId])

  return { categories, loading }
}
