'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { ABCResult } from '@inventory-saas/shared'

interface ABCCurveChartProps {
  data: ABCResult[]
}

const ABC_COLORS = { A: '#A8D8B0', B: '#F2E8A8', C: '#E8B0A8' } as const

function getBarColor(item: ABCResult): string {
  return ABC_COLORS[item.abc_class]
}

interface TooltipPayloadItem {
  name: string
  value: number | string
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-[#1A1C2E] mb-1 max-w-[180px] truncate">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          {p.name === 'Curva %' ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

export function ABCCurveChart({ data }: ABCCurveChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9CA3AF] text-sm">
        Nenhum dado disponível para o período selecionado.
      </div>
    )
  }

  // Limite a 30 itens no gráfico para legibilidade
  const chartData = data.slice(0, 30).map((item, index) => ({
    name:              item.product_name.length > 16
      ? item.product_name.slice(0, 14) + '…'
      : item.product_name,
    fullName:          item.product_name,
    valor:             Math.round(item.total_value * 100) / 100,
    'Curva %':         Math.round(item.cumulative_percent * 10) / 10,
    abc:               item.abc_class,
    fill:              ABC_COLORS[item.abc_class],
  }))

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis
          dataKey="name"
          angle={-40}
          textAnchor="end"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          interval={0}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
          formatter={(value) => <span style={{ color: '#6B7280' }}>{value}</span>}
        />
        {/* Linhas de referência A/B */}
        <ReferenceLine yAxisId="right" y={80} stroke="#A8D8B0" strokeDasharray="4 2" label={{ value: '80% (A)', position: 'right', fontSize: 10, fill: '#5A9468' }} />
        <ReferenceLine yAxisId="right" y={95} stroke="#F2E8A8" strokeDasharray="4 2" label={{ value: '95% (B)', position: 'right', fontSize: 10, fill: '#C8A840' }} />
        <Bar
          yAxisId="left"
          dataKey="valor"
          name="Valor (R$)"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
          fill="#A8C8E8"
          // Cor dinâmica por classe ABC
          label={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Curva %"
          stroke="#6D8FB0"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
