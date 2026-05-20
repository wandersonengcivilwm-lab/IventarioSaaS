import { useEffect, useRef } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'expo-notifications'
import { supabase } from '../services/supabase'
import {
  registerForPushNotifications,
  handleNotificationTap,
  clearBadge,
} from '../services/notifications'
import { useAuthStore } from '../store/authStore'

export default function RootLayout() {
  const router   = useRouter()
  const segments = useSegments()
  const { setSession, setProfile, setLoading, session, isLoading } = useAuthStore()

  // Listener de resposta (tap na notificação com app aberto ou em background)
  const notifResponseListener = useRef<Notifications.EventSubscription>()
  // Listener de notificação recebida com app em foreground
  const notifReceivedListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    // Inicializa sessão Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if (session) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(profile)

        // Registra push token após login
        await registerForPushNotifications(session.user.id)
        await clearBadge()
      } else {
        setProfile(null)
      }
    })

    // Handler de tap na notificação
    notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationTap
    )

    // Handler de notificação recebida em foreground (apenas badge/log)
    notifReceivedListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.info('[Notifications] Recebida em foreground:', notification.request.content.title)
      }
    )

    return () => {
      subscription.unsubscribe()
      notifResponseListener.current?.remove()
      notifReceivedListener.current?.remove()
    }
  }, [])

  // Guarda de autenticação
  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(app)/home')
    }
  }, [session, segments, isLoading])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor="#FAFAF8" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}
