import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store/authStore'

export interface NotificationItem {
  id:         string
  type:       string
  title:      string
  body:       string
  data:       Record<string, unknown>
  read_at:    string | null
  created_at: string
}

export function useNotifications() {
  const profile  = useAuthStore(s => s.profile)
  const tenantId = useAuthStore(s => s.tenantId)

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(true)

  // Carrega notificações e escuta em tempo real
  useEffect(() => {
    if (!profile?.id || !tenantId) return

    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, data, read_at, created_at')
        .eq('user_id', profile!.id)
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false })
        .limit(50)

      const list = (data ?? []) as NotificationItem[]
      setNotifications(list)
      setUnreadCount(list.filter(n => !n.read_at).length)
      setLoading(false)
    }

    load()

    // Realtime: nova notificação → adiciona ao topo
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const notif = payload.new as NotificationItem
          setNotifications(prev => [notif, ...prev])
          setUnreadCount(c => c + 1)
        },
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const updated = payload.new as NotificationItem
          setNotifications(prev =>
            prev.map(n => n.id === updated.id ? updated : n)
          )
          // Recalcula unread
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.read_at).length)
            return prev
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id, tenantId])

  // Marca uma notificação como lida
  const markAsRead = useCallback(async (notifId: string) => {
    const now = new Date().toISOString()
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', notifId)
      .eq('user_id', profile!.id)

    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, read_at: now } : n)
    )
    setUnreadCount(c => Math.max(0, c - 1))
  }, [profile?.id])

  // Marca todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!profile?.id) return
    const now = new Date().toISOString()
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', profile.id)
      .is('read_at', null)

    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? now })))
    setUnreadCount(0)
  }, [profile?.id])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
