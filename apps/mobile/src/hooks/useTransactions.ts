import { useState, useEffect } from 'react'
import { Q } from '@nozbe/watermelondb'
import { transactionsCollection } from '../db'
import Transaction from '../db/models/Transaction'
import { useAuthStore } from '../store/authStore'

export function useTransactions(productServerId?: string, limit = 50) {
  const tenantId = useAuthStore(s => s.tenantId)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!tenantId) return

    const conditions: any[] = [Q.where('tenant_id', tenantId)]
    if (productServerId) conditions.push(Q.where('product_id', productServerId))

    const subscription = transactionsCollection
      .query(
        ...conditions,
        Q.sortBy('created_at', Q.desc),
        Q.take(limit),
      )
      .observe()
      .subscribe(results => {
        setTransactions(results)
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [tenantId, productServerId, limit])

  return { transactions, loading }
}
