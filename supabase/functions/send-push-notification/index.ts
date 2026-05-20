import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRow {
  id:        string
  user_id:   string
  tenant_id: string
  type:      string
  title:     string
  body:      string
  data:      Record<string, unknown>
}

interface ExpoMessage {
  to:    string
  sound: string
  title: string
  body:  string
  data:  Record<string, unknown>
  badge?: number
}

/**
 * Envia via Expo Push API (handles APNs + FCM transparently)
 * Retorna true se enviou com sucesso
 */
async function sendExpoPush(token: string, message: Omit<ExpoMessage, 'to'>): Promise<boolean> {
  const payload: ExpoMessage = { to: token, ...message }

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify(payload),
  })

  if (!res.ok) {
    console.error('[PushSend] Expo API error:', await res.text())
    return false
  }

  const json = await res.json()
  const result = json.data
  if (result?.status === 'error') {
    console.error('[PushSend] Expo delivery error:', result.message)
    return false
  }

  return true
}

/**
 * Envia via FCM HTTP v1 API (Android direto, sem Expo gateway)
 * Necessário: FIREBASE_PROJECT_ID e token de acesso OAuth2 do service account
 */
async function sendFCMDirect(fcmToken: string, message: Omit<ExpoMessage, 'to'>): Promise<boolean> {
  const projectId    = Deno.env.get('FIREBASE_PROJECT_ID')
  const serviceEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')
  const privateKey   = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n')

  if (!projectId || !serviceEmail || !privateKey) {
    console.warn('[PushSend] Firebase env vars not set, skipping FCM direct')
    return false
  }

  // Obter access token OAuth2 para FCM v1
  // Em produção: use uma biblioteca JWT Deno-compatível
  // Por ora, delegamos ao Expo Push API acima para FCM
  console.info('[PushSend] FCM v1 direct: configure FIREBASE_* env vars e use JWT library')
  return false
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  try {
    // A Edge Function é chamada por um Supabase Webhook no INSERT de notifications
    // Payload: { type: "INSERT", table: "notifications", record: {...}, schema: "public" }
    const webhook = await req.json()
    const record  = webhook.record as NotificationRow

    if (!record?.user_id || !record?.id) {
      return new Response('Payload inválido', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Busca tokens do usuário
    const { data: user } = await supabase
      .from('users')
      .select('push_token, fcm_token')
      .eq('id', record.user_id)
      .single()

    if (!user?.push_token && !user?.fcm_token) {
      console.info('[PushSend] Usuário sem token registrado:', record.user_id)
      return new Response('Sem token', { status: 200 })
    }

    // Monta o payload de notificação
    const message = {
      sound: 'default' as const,
      title: record.title,
      body:  record.body,
      data:  {
        ...record.data,
        type:            record.type,
        notification_id: record.id,
        // Deep link: ex. estoque://products/[product_id]
        ...(record.type === 'low_stock' && record.data?.product_id
          ? { deep_link: `estoque://products/${record.data.product_id}` }
          : {}),
        ...(record.type === 'kanban_move'
          ? { deep_link: 'estoque://kanban' }
          : {}),
      },
    }

    let sent = false

    // Tenta Expo Push primeiro (funciona para tokens ExponentPushToken[...])
    if (user.push_token?.startsWith('ExponentPushToken')) {
      sent = await sendExpoPush(user.push_token, message)
    }

    // Fallback: FCM direto (para tokens nativos FCM)
    if (!sent && user.fcm_token) {
      sent = await sendFCMDirect(user.fcm_token, message)
    }

    // Atualiza sent_at na notificação
    if (sent) {
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', record.id)
    }

    return new Response(
      JSON.stringify({ sent, notification_id: record.id }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[PushSend] Error:', message)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})
