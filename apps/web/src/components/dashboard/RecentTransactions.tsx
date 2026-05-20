import { formatCurrency, transactionTypeLabel, formatRelative } from '@inventory-saas/shared'

interface Transaction {
  id:          string
  type:        string
  quantity:    number
  unit_cost:   number | null
  created_at:  string
  products:    { name: string; unit: string } | null
  users:       { full_name: string } | null
}

const TYPE_COLORS: Record<string, string> = {
  entry:        '#A8D8B0',
  exit:         '#E8B0A8',
  adjustment:   '#F2E8A8',
  transfer_in:  '#A8C8E8',
  transfer_out: '#E8A8C8',
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[#9CA3AF] text-sm">
        Nenhuma movimentação registrada ainda.
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#F3F4F6]">
      {transactions.map(tx => {
        const isEntry = ['entry', 'transfer_in'].includes(tx.type)
        const color   = TYPE_COLORS[tx.type] ?? '#E5E7EB'
        return (
          <div key={tx.id} className="flex items-center gap-4 py-3">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1C2E] truncate">
                {tx.products?.name ?? '—'}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {transactionTypeLabel(tx.type)} • {tx.users?.full_name ?? '—'} • {formatRelative(tx.created_at)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-bold ${isEntry ? 'text-[#5A9468]' : 'text-[#C05040]'}`}>
                {isEntry ? '+' : '−'}{tx.quantity} {tx.products?.unit ?? ''}
              </p>
              {tx.unit_cost && (
                <p className="text-xs text-[#9CA3AF]">
                  {formatCurrency(tx.quantity * tx.unit_cost)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
