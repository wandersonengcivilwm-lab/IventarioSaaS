import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// ─── Configuração do handler de foreground ────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
})

// ─── Registro de push token ───────────────────────────────────
export async function registerForPushNotifications(userId: string): Promise<void> {
  // Notificações não funcionam em simuladores sem configuração
  if (!Device.isDevice) {
    console.info('[Notifications] Push não disponível em simulador')
    return
  }

  // Solicita permissão
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permissão negada pelo usuário')
    return
  }

  // Canal Android obrigatório
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:           'Padrão',
      importance:     Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:     '#A8C8E8',
      sound:          'default',
    })

    await Notifications.setNotificationChannelAsync('low_stock', {
      name:           'Estoque Baixo',
      importance:     Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor:     '#E8B0A8',
      sound:          'default',
    })
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data

    // Salva o token no perfil do usuário
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId)

    if (error) {
      console.error('[Notifications] Erro ao salvar token:', error.message)
    } else {
      console.info('[Notifications] Token registrado:', token.slice(0, 30) + '...')
    }
  } catch (err) {
    console.error('[Notifications] Erro ao obter token:', err)
  }
}

// ─── Deep link ao tocar na notificação ───────────────────────
export function handleNotificationTap(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data as Record<string, unknown>

  if (!data) return

  const type        = data.type as string | undefined
  const productId   = data.product_id as string | undefined
  const deepLink    = data.deep_link as string | undefined

  // Navega para a tela correta baseada no tipo
  try {
    if (type === 'low_stock' && productId) {
      // Busca produto local por server_id e navega
      router.push(`/(app)/products/${productId}` as any)
      return
    }

    if (type === 'kanban_move') {
      router.push('/(app)/kanban')
      return
    }

    if (type === 'transaction') {
      router.push('/(app)/transactions/index' as any)
      return
    }

    // Fallback: abre central de notificações
    router.push('/(app)/notifications' as any)
  } catch (err) {
    console.error('[Notifications] Erro no deep link:', err)
  }
}

// ─── Limpa o badge ao abrir o app ────────────────────────────
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0)
}

// ─── Remove o token ao fazer logout ──────────────────────────
export async function unregisterPushToken(userId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ push_token: null, fcm_token: null })
    .eq('id', userId)
}
