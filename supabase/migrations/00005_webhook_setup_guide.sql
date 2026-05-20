-- =============================================================
-- CONFIGURAÇÃO DO WEBHOOK DE NOTIFICAÇÕES PUSH
-- Execute este guia manualmente no Supabase Dashboard
-- =============================================================

-- PASSO 1: Deploy das Edge Functions
-- Execute no terminal:
--   supabase functions deploy send-push-notification
--   supabase functions deploy invite-user
--   supabase functions deploy generate-qr

-- PASSO 2: Configurar variáveis de ambiente das Edge Functions
-- No Supabase Dashboard → Edge Functions → send-push-notification → Secrets:
--   SUPABASE_URL          = https://seu-projeto.supabase.co
--   SUPABASE_ANON_KEY     = sua-anon-key
--   SUPABASE_SERVICE_ROLE_KEY = sua-service-role-key
-- Para FCM v1 direto (opcional):
--   FIREBASE_PROJECT_ID   = seu-firebase-project-id
--   FIREBASE_CLIENT_EMAIL = firebase-adminsdk@...iam.gserviceaccount.com
--   FIREBASE_PRIVATE_KEY  = -----BEGIN PRIVATE KEY-----...

-- PASSO 3: Criar o Webhook no Supabase
-- Dashboard → Database → Webhooks → Create a new hook
--
-- Name:     send_push_on_notification
-- Table:    public.notifications
-- Events:   INSERT (apenas)
-- Type:     HTTPS Request
-- URL:      https://SEU_PROJETO.supabase.co/functions/v1/send-push-notification
-- Headers:
--   Content-Type: application/json
--   Authorization: Bearer SUA_SERVICE_ROLE_KEY
--
-- Payload template: default (Supabase envia { type, table, schema, record, old_record })

-- PASSO 4: Testar o fluxo
-- 1. No app mobile, faça login → push_token é salvo automaticamente
-- 2. Crie um produto com min_stock > 0
-- 3. Registre uma saída que leve o estoque abaixo do mínimo
-- 4. O trigger apply_transaction_to_stock insere em notifications
-- 5. O webhook dispara send-push-notification
-- 6. Notificação push chega no dispositivo em ~10 segundos

-- VERIFICAÇÃO: checar notifications inseridas
SELECT id, user_id, type, title, sent_at, created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 20;

-- VERIFICAÇÃO: checar tokens dos usuários
SELECT id, full_name, push_token IS NOT NULL as has_push_token, fcm_token IS NOT NULL as has_fcm_token
FROM public.users;
