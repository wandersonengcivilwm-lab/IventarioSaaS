'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DayData {
  date:    string
  entries: number
  exits:   number
  net:     number
}

interface StockHistoryChartProps {
  data: DayData[]
}

export function StockHistoryChart({ data }: StockHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[#9CA3AF] text-sm">
        Sem movimentações no período.
      </div>
    )
  }

  const chartData = data.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="entries" name="Entradas" stroke="#A8D8B0" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="exits"   name="Saídas"   stroke="#E8B0A8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="net"     name="Saldo"    stroke="#A8C8E8" strokeWidth={2} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  )
}
