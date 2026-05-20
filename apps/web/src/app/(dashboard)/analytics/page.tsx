import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeABCCurve, formatCurrency } from '@inventory-saas/shared'
import { ABCCurveChart } from '@/components/charts/ABCCurveChart'
import { ABCFilters } from './ABCFilters'

const ABC_LABELS = { A: 'A — Prioritário', B: 'B — Secundário', C: 'C — Baixo giro' }
const ABC_BG     = { A: '#D4F0DA', B: '#F9F3D0', C: '#F5D8D4' }
const ABC_TEXT   = { A: '#5A9468',  B: '#C8A840', C: '#C05040' }
const ABC_BORDER = { A: '#A8D8B0', B: '#F2E8A8', C: '#E8B0A8' }

interface AnalyticsPageProps {
  searchParams: { days?: string }
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const days  = parseInt(searchParams.days ?? '90', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Busca transações de saída com custo unitário (para calcular valor movimentado)
  const { data: txRows } = await supabase
    .from('transactions')
    .select('product_id, quantity, unit_cost, products(name, unit)')
    .eq('tenant_id', profile.tenant_id)
    .in('type', ['exit', 'transfer_out'])
    .gte('created_at', since)
    .not('unit_cost', 'is', null)

  // Fallback: se não houver transações com custo, usa entradas
  const { data: txEntries } = !txRows?.length
    ? await supabase
        .from('transactions')
        .select('product_id, quantity, unit_cost, products(name, unit)')
        .eq('tenant_id', profile.tenant_id)
        .in('type', ['entry', 'transfer_in'])
        .gte('created_at', since)
        .not('unit_cost', 'is', null)
    : { data: null }

  const rawTx = (txRows?.length ? txRows : txEntries) ?? []

  const abcInput = rawTx
    .filter((tx: any) => tx.unit_cost && tx.products)
    .map((tx: any) => ({
      product_id:   tx.product_id,
      product_name: (tx.products as any)?.name ?? 'Desconhecido',
      quantity:     tx.quantity,
      unit_cost:    tx.unit_cost,
    }))

  const abcResults = computeABCCurve(abcInput)

  // Estatísticas por classe
  const byClass = { A: [] as typeof abcResults, B: [] as typeof abcResults, C: [] as typeof abcResults }
  for (const r of abcResults) byClass[r.abc_class].push(r)

  const totalValue = abcResults.reduce((s, r) => s + r.total_value, 0)

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1C2E]">Análise — Curva ABC</h1>
        <p className="text-[#6B7280] mt-1">
          Classificação dos produtos por valor de movimentação no período
        </p>
      </div>

      {/* Filtros de período */}
      <div className="mb-6">
        <Suspense>
          <ABCFilters />
        </Suspense>
      </div>

      {abcResults.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-lg font-semibold text-[#1A1C2E]">Sem dados suficientes</p>
          <p className="text-sm text-[#6B7280] mt-2">
            Registre movimentações com custo unitário para ver a Curva ABC.
          </p>
        </div>
      ) : (
        <>
          {/* Cards de resumo por classe */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(['A', 'B', 'C'] as const).map(cls => {
              const items     = byClass[cls]
              const clsValue  = items.reduce((s, r) => s + r.total_value, 0)
              const pct       = totalValue > 0 ? (clsValue / totalValue * 100).toFixed(1) : '0'
              return (
                <div
                  key={cls}
                  className="rounded-2xl p-5 border"
                  style={{ backgroundColor: ABC_BG[cls], borderColor: ABC_BORDER[cls] }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: ABC_BORDER[cls], color: ABC_TEXT[cls] }}
                    >
                      Classe {cls}
                    </span>
                    <span className="text-2xl font-bold" style={{ color: ABC_TEXT[cls] }}>
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[#1A1C2E]">{items.length} produtos</p>
                  <p className="text-sm text-[#6B7280] mt-1">{formatCurrency(clsValue)} movimentados</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{ABC_LABELS[cls]}</p>
                </div>
              )
            })}
          </div>

          {/* Gráfico */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-8">
            <h2 className="text-base font-semibold text-[#1A1C2E] mb-4">
              Distribuição por valor — Top {Math.min(30, abcResults.length)} produtos
            </h2>
            <ABCCurveChart data={abcResults} />
          </div>

          {/* Tabela completa */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1A1C2E]">
                Classificação completa ({abcResults.length} produtos)
              </h2>
              <span className="text-sm text-[#9CA3AF]">Valor total: {formatCurrency(totalValue)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F4F6]">
                    {['#', 'Produto', 'Classe', 'Valor movimentado', '% do total', '% acumulado'].map(h => (
                      <th key={h} className="text-left text-xs text-[#9CA3AF] font-medium uppercase tracking-wide px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F9FAFB]">
                  {abcResults.map((item, i) => (
                    <tr key={item.product_id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-5 py-3 text-[#9CA3AF] font-mono text-xs">{i + 1}</td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-[#1A1C2E]">{item.product_name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: ABC_BG[item.abc_class],
                            color: ABC_TEXT[item.abc_class],
                            border: `1px solid ${ABC_BORDER[item.abc_class]}`,
                          }}
                        >
                          {item.abc_class}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-[#1A1C2E]">
                        {formatCurrency(item.total_value)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full max-w-[80px]">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${(item.total_value / totalValue * 100).toFixed(1)}%`,
                                backgroundColor: ABC_BORDER[item.abc_class],
                              }}
                            />
                          </div>
                          <span className="text-[#6B7280] tabular-nums">
                            {(item.total_value / totalValue * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#6B7280] tabular-nums">
                        {item.cumulative_percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
