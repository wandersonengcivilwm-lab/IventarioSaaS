import { colors } from '../../theme/colors'
import { Badge } from '../ui/Badge'

interface StockBadgeProps {
  quantity:  number
  minStock:  number
  unit:      string
}

export function StockBadge({ quantity, minStock, unit }: StockBadgeProps) {
  const formatted = Number.isInteger(quantity)
    ? quantity.toString()
    : quantity.toFixed(2).replace(/\.?0+$/, '')

  if (quantity <= 0) {
    return <Badge label={`Sem estoque • ${formatted} ${unit}`} variant="danger" />
  }
  if (minStock > 0 && quantity <= minStock) {
    return <Badge label={`Estoque baixo • ${formatted} ${unit}`} variant="warning" />
  }
  return <Badge label={`${formatted} ${unit}`} variant="success" />
}
