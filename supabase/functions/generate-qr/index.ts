import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Formato do payload QR interno
const QR_PREFIX = 'inv:'

function buildPayload(productId: string): string {
  return `${QR_PREFIX}${productId}`
}

/**
 * Edge Function: generate-qr
 *
 * POST /functions/v1/generate-qr
 * Body: { product_id: string }
 *
 * Gera o payload QR para um produto e atualiza o campo qr_code no banco.
 * O QR é gerado e exibido client-side com react-native-qrcode-svg —
 * esta função apenas persiste o payload canônico.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { product_id } = await req.json()
    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id é obrigatório' }), { status: 400 })
    }

    // Verifica se já tem qr_code
    const { data: product } = await supabase
      .from('products')
      .select('id, qr_code, tenant_id')
      .eq('id', product_id)
      .single()

    if (!product) {
      return new Response(JSON.stringify({ error: 'Produto não encontrado' }), { status: 404 })
    }

    if (product.qr_code) {
      return new Response(JSON.stringify({ qr_payload: product.qr_code, existed: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Gera e persiste o payload
    const payload = buildPayload(product_id)

    const { error: updateError } = await supabase
      .from('products')
      .update({ qr_code: payload })
      .eq('id', product_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ qr_payload: payload, existed: false }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})
