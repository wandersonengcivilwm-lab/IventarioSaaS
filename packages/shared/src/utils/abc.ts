export type ABCClass = 'A' | 'B' | 'C'

export interface ABCInput {
  product_id: string
  product_name: string
  quantity: number
  unit_cost: number
}

export interface ABCResult {
  product_id: string
  product_name: string
  total_value: number
  cumulative_percent: number
  abc_class: ABCClass
}

/**
 * Curva ABC por valor de movimentação.
 * A = top 80% do valor acumulado
 * B = próximos 15% (até 95%)
 * C = restante (5%)
 */
export function computeABCCurve(transactions: ABCInput[]): ABCResult[] {
  const valueMap = new Map<string, { name: string; value: number }>()

  for (const tx of transactions) {
    const prev = valueMap.get(tx.product_id) ?? { name: tx.product_name, value: 0 }
    valueMap.set(tx.product_id, {
      name: tx.product_name,
      value: prev.value + tx.quantity * tx.unit_cost,
    })
  }

  const sorted = [...valueMap.entries()]
    .map(([id, { name, value }]) => ({ product_id: id, product_name: name, total_value: value }))
    .sort((a, b) => b.total_value - a.total_value)

  const total = sorted.reduce((s, p) => s + p.total_value, 0)
  if (total === 0) return []

  let cumulative = 0
  return sorted.map(p => {
    cumulative += p.total_value
    const cumulative_percent = (cumulative / total) * 100
    const abc_class: ABCClass =
      cumulative_percent <= 80 ? 'A' : cumulative_percent <= 95 ? 'B' : 'C'
    return { ...p, cumulative_percent, abc_class }
  })
}
