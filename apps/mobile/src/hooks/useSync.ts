import { useEffect, useRef, useState, useCallback } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { syncAll } from '../services/sync'
import { useAuthStore } from '../store/authStore'

export function useSync() {
  const [syncing, setSyncing]     = useState(false)
  const [lastSync, setLastSync]   = useState<Date | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const tenantId = useAuthStore(s => s.tenantId)
  const profile  = useAuthStore(s => s.profile)

  const sync = useCallback(async () => {
    if (!tenantId || !profile?.id || syncing) return
    setSyncing(true)
    setError(null)
    try {
      await syncAll(tenantId, profile.id)
      setLastSync(new Date())
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }, [tenantId, profile?.id, syncing])

  // Sincroniza ao recuperar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        sync()
      }
    })
    // Sync inicial
    sync()
    return unsubscribe
  }, [tenantId, profile?.id])

  return { syncing, lastSync, error, sync }
}
