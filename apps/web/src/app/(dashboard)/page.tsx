import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeABCCurve, formatCurrency, formatDate } from '@inventory-saas/shared'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { StockHistoryChart } from '@/components/charts/StockHistoryChart'

// Agrega transações dos últimos 30 dias em dados diários para o gráfico
function buildDailyHistory(transactions: any[]) {
  const map: Record<string, { entries: number; exits: number }> = {}

  for (const tx of transactions) {
    const date = tx.created_at.slice(0, 10)
    if (!map[date]) map[date] = { entries: 0, exits: 0 }
    if (['entry', 'transfer_in'].includes(tx.type)) {
      map[date].entries += tx.quantity
    } else if (['exit', 'transfer_out'].includes(tx.type)) {
      map[date].exits += tx.quantity
    }
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { entries, exits }]) => ({
      date,
      entries: Math.round(entries * 100) / 100,
      exits:   Math.round(exits * 100) / 100,
      net:     Math.round((entries - exits) * 100) / 100,
    }))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, full_name, role, tenants(name)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const tenantId = profile.tenant_id
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const todayStr = new Date().toISOString().split('T')[0]

  // Queries paralelas para KPIs
  const [
    productsRes,
    inventoryRes,
    lowStockRes,
    todayTxRes,
    recentTxRes,
    historyTxRes,
    abcTxRes,
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),

    supabase
      .from('inventory_items')
      .select('quantity, products(cost_price)')
      .eq('tenant_id', tenantId),

    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('read_at', null)
      .eq('type', 'low_stock'),

    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', `${todayStr}T00:00:00`),

    supabase
      .from('transactions')
      .select('id, type, quantity, unit_cost, created_at, products(name, unit), users(full_name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('transactions')
      .select('type, quantity, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', since30d)
      .order('created_at', { ascending: true }),

    supabase
      .from('transactions')
      .select('product_id, quantity, unit_cost, products(name)')
      .eq('tenant_id', tenantId)
      .in('type', ['exit', 'transfer_out'])
      .gte('created_at', since90d)
      .not('unit_cost', 'is', null),
  ])

  // Valor total em estoque
  const totalStockValue = (inventoryRes.data ?? []).reduce((sum: number, item: any) => {
    return sum + (item.quantity ?? 0) * (item.products?.cost_price ?? 0)
  }, 0)

  // Curva ABC — top 5 produtos
  const abcInput = (abcTxRes.data ?? [])
    .filter((tx: any) => tx.unit_cost && tx.products)
    .map((tx: any) => ({
      product_id:   tx.product_id,
      product_name: (tx.products as any)?.name ?? '—',
      quantity:     tx.quantity,
      unit_cost:    tx.unit_cost,
    }))
  const abcTop5 = computeABCCurve(abcInput).slice(0, 5)

  const dailyHistory = buildDailyHistory(historyTxRes.data ?? [])
  const firstName = (profile as any).full_name?.split(' ')[0] ?? 'Usuário'
  const companyName = (profile as any).tenants?.name ?? ''

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C2E]">Olá, {firstName} 👋</h1>
          <p className="text-[#6B7280] mt-1">
            {companyName} —{' '}
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/dashboard/transactions"
          className="bg-[#6D8FB0] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#5A7A9A] transition-colors"
        >
          + Nova movimentação
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          emoji="📦"
          label="Produtos ativos"
          value={productsRes.count ?? 0}
          bg="#D4E8F5"
        />
        <StatsCard
          emoji="💰"
          label="Valor em estoque"
          value={formatCurrency(totalStockValue)}
          sub="Custo × quantidade"
          bg="#D4F0DA"
        />
        <StatsCard
          emoji="⚠️"
          label="Alertas estoque baixo"
          value={lowStockRes.count ?? 0}
          bg={(lowStockRes.count ?? 0) > 0 ? '#FEE2E2' : '#D4F0DA'}
        />
        <StatsCard
          emoji="🔄"
          label="Movimentações hoje"
          value={todayTxRes.count ?? 0}
          bg="#F9F3D0"
        />
      </div>

      {/* Gráfico histórico + Top 5 ABC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1C2E]">Movimentações — últimos 30 dias</h2>
          </div>
          <StockHistoryChart data={dailyHistory} />
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1C2E]">Top 5 — Curva ABC</h2>
            <Link href="/dashboard/analytics" className="text-xs text-[#6D8FB0] hover:underline">
              Ver todos →
            </Link>
          </div>
          {abcTop5.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] py-8 text-center">
              Sem dados de movimentação com custo.
            </p>
          ) : (
            <div className="space-y-3">
              {abcTop5.map((item, i) => {
                const bgMap = { A: '#D4F0DA', B: '#F9F3D0', C: '#F5D8D4' } as const
                const txtMap = { A: '#5A9468', B: '#C8A840', C: '#C05040' } as const
                return (
                  <div key={item.product_id} className="flex items-center gap-3">
                    <span className="text-xs text-[#9CA3AF] w-4 font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1C2E] truncate">{item.product_name}</p>
                      <p className="text-xs text-[#9CA3AF]">{formatCurrency(item.total_value)}</p>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: bgMap[item.abc_class], color: txtMap[item.abc_class] }}
                    >
                      {item.abc_class}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transações recentes */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1C2E]">Últimas movimentações</h2>
          <Link href="/dashboard/transactions" className="text-xs text-[#6D8FB0] hover:underline">
            Ver todas →
          </Link>
        </div>
        <RecentTransactions transactions={(recentTxRes.data ?? []) as any} />
      </div>
    </div>
  )
}
