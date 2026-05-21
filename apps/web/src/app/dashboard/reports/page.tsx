import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { can } from '@inventory-saas/shared'
import type { UserRole } from '@inventory-saas/shared'

// jsPDF só funciona no browser — carregamento lazy sem SSR
const ExportButtons = dynamic(
  () => import('./ExportButtons').then(m => m.ExportButtons),
  { ssr: false, loading: () => <p className="text-sm text-[#9CA3AF]">Carregando opções de exportação...</p> }
)

interface ReportsPageProps {
  searchParams: { from?: string; to?: string }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const role = profile.role as UserRole
  if (!can(role, 'export_report')) {
    return (
      <div className="p-8">
        <div className="bg-[#FEE2E2] rounded-2xl p-8 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold text-[#C05040]">Sem permissão</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Apenas owner e admin podem exportar relatórios.</p>
        </div>
      </div>
    )
  }

  const today  = new Date().toISOString().slice(0, 10)
  const ago30d = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10)
  const ago90d = new Date(Date.now() - 90 * 86400 * 1000).toISOString().slice(0, 10)

  const fromDate = searchParams.from ?? ago30d
  const toDate   = searchParams.to   ?? today

  // KPIs de resumo para o período
  const [txRes, prodRes, lowStockRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, type, quantity, unit_cost', { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .gte('created_at', fromDate)
      .lte('created_at', toDate + 'T23:59:59'),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .eq('type', 'low_stock')
      .is('read_at', null),
  ])

  const transactions = txRes.data ?? []
  const totalEntries = transactions.filter((t: any) => ['entry','transfer_in'].includes(t.type)).length
  const totalExits   = transactions.filter((t: any) => ['exit','transfer_out'].includes(t.type)).length
  const totalValue   = transactions.reduce((s: number, t: any) => s + (t.unit_cost ? t.quantity * t.unit_cost : 0), 0)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1C2E]">Relatórios</h1>
        <p className="text-[#6B7280] mt-1">Exporte seus dados em CSV ou PDF</p>
      </div>

      {/* Filtro de período */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 mb-6">
        <h2 className="font-semibold text-[#1A1C2E] mb-4">Período de análise</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { label: 'Últimos 7 dias',  from: new Date(Date.now() - 7*86400*1000).toISOString().slice(0,10) },
            { label: 'Últimos 30 dias', from: ago30d },
            { label: 'Últimos 90 dias', from: ago90d },
            { label: 'Este ano',        from: new Date().getFullYear() + '-01-01' },
          ].map(preset => (
            <a
              key={preset.label}
              href={`/dashboard/reports?from=${preset.from}&to=${today}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                fromDate === preset.from && toDate === today
                  ? 'bg-[#6D8FB0] text-white'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
              }`}
            >
              {preset.label}
            </a>
          ))}
        </div>
        <div className="flex gap-3 items-center text-sm">
          <span className="text-[#6B7280]">Personalizado:</span>
          <a
            href={`/dashboard/reports?from=${fromDate}&to=${toDate}`}
            className="text-xs text-[#9CA3AF]"
          >
            {fromDate} → {toDate}
          </a>
        </div>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Movimentações',     value: txRes.count ?? 0,        bg: '#D4E8F5', emoji: '🔄' },
          { label: 'Entradas',          value: totalEntries,             bg: '#D4F0DA', emoji: '📥' },
          { label: 'Saídas',            value: totalExits,               bg: '#F5D8D4', emoji: '📤' },
          { label: 'Produtos ativos',   value: prodRes.count ?? 0,       bg: '#F9F3D0', emoji: '📦' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ backgroundColor: card.bg }}>
            <p className="text-xl mb-1">{card.emoji}</p>
            <p className="text-2xl font-bold text-[#1A1C2E]">{card.value}</p>
            <p className="text-xs text-[#6B7280]">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Botões de exportação */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-6">
        <h2 className="font-semibold text-[#1A1C2E] mb-5">Exportar dados</h2>
        <Suspense fallback={<div className="text-sm text-[#9CA3AF]">Carregando...</div>}>
          <ExportButtons fromDate={fromDate} toDate={toDate} />
        </Suspense>
      </div>

      {/* Alertas ativos */}
      {(lowStockRes.count ?? 0) > 0 && (
        <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-semibold text-[#C05040]">
              {lowStockRes.count} alerta{lowStockRes.count !== 1 ? 's' : ''} de estoque baixo
            </span>
          </div>
          <p className="text-sm text-[#C05040] mt-1 ml-7">
            Inclua o relatório de estoque para identificar quais produtos precisam de reposição.
          </p>
        </div>
      )}
    </div>
  )
}
