import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ReportType = 'transactions' | 'inventory' | 'abc'

// ─── Geração de CSV ───────────────────────────────────────────
function arrayToCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ]
  return lines.join('\r\n')
}

async function generateTransactionsCSV(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  fromDate: string,
  toDate: string,
): Promise<string> {
  const { data } = await supabase
    .from('transactions')
    .select('created_at, type, quantity, unit_cost, reference, notes, scanned_via_qr, products(name, unit, sku), warehouses(name), users(full_name)')
    .eq('tenant_id', tenantId)
    .gte('created_at', fromDate)
    .lte('created_at', toDate)
    .order('created_at', { ascending: false })

  const TYPE_MAP: Record<string, string> = {
    entry: 'Entrada', exit: 'Saída', adjustment: 'Ajuste',
    transfer_in: 'Transferência (entrada)', transfer_out: 'Transferência (saída)',
  }

  const headers = [
    'Data/Hora', 'Tipo', 'Produto', 'SKU', 'Unidade', 'Quantidade',
    'Custo unitário', 'Valor total', 'Depósito', 'Responsável', 'Referência', 'Observações', 'Via QR',
  ]

  const rows = (data ?? []).map((tx: any) => [
    new Date(tx.created_at).toLocaleString('pt-BR'),
    TYPE_MAP[tx.type] ?? tx.type,
    tx.products?.name ?? '',
    tx.products?.sku ?? '',
    tx.products?.unit ?? '',
    tx.quantity,
    tx.unit_cost ?? '',
    tx.unit_cost ? (tx.quantity * tx.unit_cost).toFixed(2) : '',
    tx.warehouses?.name ?? '',
    tx.users?.full_name ?? '',
    tx.reference ?? '',
    tx.notes ?? '',
    tx.scanned_via_qr ? 'Sim' : 'Não',
  ])

  return arrayToCSV(headers, rows)
}

async function generateInventoryCSV(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
): Promise<string> {
  const { data } = await supabase
    .from('inventory_items')
    .select('quantity, reserved_qty, updated_at, products(name, sku, unit, min_stock, cost_price), warehouses(name)')
    .eq('tenant_id', tenantId)
    .order('products(name)')

  const headers = [
    'Produto', 'SKU', 'Unidade', 'Depósito', 'Saldo atual',
    'Reservado', 'Disponível', 'Estoque mínimo', 'Status', 'Custo unitário',
    'Valor em estoque', 'Última atualização',
  ]

  const rows = (data ?? []).map((item: any) => {
    const qty       = item.quantity ?? 0
    const reserved  = item.reserved_qty ?? 0
    const available = Math.max(0, qty - reserved)
    const minStock  = item.products?.min_stock ?? 0
    const status    = qty <= 0 ? 'Sem estoque' : minStock > 0 && qty <= minStock ? 'Estoque baixo' : 'Normal'
    const costPrice = item.products?.cost_price ?? 0
    return [
      item.products?.name ?? '',
      item.products?.sku ?? '',
      item.products?.unit ?? '',
      item.warehouses?.name ?? '',
      qty,
      reserved,
      available,
      minStock,
      status,
      costPrice || '',
      costPrice ? (qty * costPrice).toFixed(2) : '',
      new Date(item.updated_at).toLocaleString('pt-BR'),
    ]
  })

  return arrayToCSV(headers, rows)
}

async function generateABCCSV(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  fromDate: string,
): Promise<string> {
  const { data } = await supabase
    .from('transactions')
    .select('product_id, quantity, unit_cost, products(name, unit)')
    .eq('tenant_id', tenantId)
    .in('type', ['exit', 'transfer_out', 'entry', 'transfer_in'])
    .gte('created_at', fromDate)
    .not('unit_cost', 'is', null)

  // Agrega por produto
  const map = new Map<string, { name: string; unit: string; value: number }>()
  for (const tx of data ?? [] as any[]) {
    if (!tx.unit_cost || !tx.products) continue
    const prev = map.get(tx.product_id) ?? { name: tx.products.name, unit: tx.products.unit, value: 0 }
    map.set(tx.product_id, { ...prev, value: prev.value + tx.quantity * tx.unit_cost })
  }

  const sorted = [...map.entries()]
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.value - a.value)

  const total = sorted.reduce((s, p) => s + p.value, 0)
  let cumulative = 0

  const headers = ['Rank', 'Produto', 'Unidade', 'Valor movimentado', '% do total', '% acumulado', 'Classe ABC']
  const rows = sorted.map((p, i) => {
    cumulative += p.value
    const pct    = total > 0 ? (p.value / total * 100) : 0
    const cumPct = total > 0 ? (cumulative / total * 100) : 0
    const cls    = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C'
    return [i + 1, p.name, p.unit, p.value.toFixed(2), pct.toFixed(1) + '%', cumPct.toFixed(1) + '%', cls]
  })

  return arrayToCSV(headers, rows)
}

// ─── Handler principal ────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: CORS })
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Permissão negada' }), { status: 403 })
    }

    const {
      report   = 'transactions',
      from_date,
      to_date,
    }: { report?: ReportType; from_date?: string; to_date?: string } = await req.json()

    const now     = new Date()
    const toDate  = to_date   ?? now.toISOString()
    const fromDate = from_date ?? new Date(now.getTime() - 90 * 86400 * 1000).toISOString()

    // Gera o CSV
    let csvContent: string
    switch (report) {
      case 'inventory':
        csvContent = await generateInventoryCSV(supabaseAdmin, profile.tenant_id)
        break
      case 'abc':
        csvContent = await generateABCCSV(supabaseAdmin, profile.tenant_id, fromDate)
        break
      default:
        csvContent = await generateTransactionsCSV(supabaseAdmin, profile.tenant_id, fromDate, toDate)
    }

    // Nome do arquivo
    const dateStr   = now.toISOString().slice(0, 10)
    const fileName  = `${report}-${dateStr}-${user.id.slice(0, 8)}.csv`
    const storagePath = `${profile.tenant_id}/${fileName}`

    // Cria bucket se não existir
    await supabaseAdmin.storage.createBucket('reports', {
      public: false,
      allowedMimeTypes: ['text/csv', 'application/pdf'],
      fileSizeLimit: 52428800, // 50MB
    }).catch(() => { /* Bucket já existe */ })

    // Upload para Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('reports')
      .upload(storagePath, new TextEncoder().encode(csvContent), {
        contentType:  'text/csv; charset=utf-8',
        upsert:       true,
      })

    if (uploadError) throw uploadError

    // URL assinada (1 hora)
    const { data: signedUrl } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(storagePath, 3600)

    return new Response(
      JSON.stringify({
        url:       signedUrl?.signedUrl,
        fileName,
        rows:      csvContent.split('\n').length - 1,
        expiresIn: 3600,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})
