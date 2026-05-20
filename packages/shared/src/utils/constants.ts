export const PRODUCT_UNITS = [
  { value: 'un',  label: 'Unidade' },
  { value: 'kg',  label: 'Quilograma' },
  { value: 'g',   label: 'Grama' },
  { value: 'l',   label: 'Litro' },
  { value: 'ml',  label: 'Mililitro' },
  { value: 'm',   label: 'Metro' },
  { value: 'cx',  label: 'Caixa' },
  { value: 'pct', label: 'Pacote' },
] as const

export const TRANSACTION_TYPES = [
  { value: 'entry',        label: 'Entrada',                color: '#A8D8B0' },
  { value: 'exit',         label: 'Saída',                  color: '#E8B0A8' },
  { value: 'adjustment',   label: 'Ajuste',                 color: '#F2E8A8' },
  { value: 'transfer_in',  label: 'Transferência (entrada)', color: '#A8C8E8' },
  { value: 'transfer_out', label: 'Transferência (saída)',   color: '#E8A8C8' },
] as const

export const KANBAN_PRIORITIES = [
  { value: 'low',    label: 'Baixa',   color: '#9CA3AF' },
  { value: 'medium', label: 'Média',   color: '#F2E8A8' },
  { value: 'high',   label: 'Alta',    color: '#F97316' },
  { value: 'urgent', label: 'Urgente', color: '#EF4444' },
] as const

export const ABC_COLORS = {
  A: '#A8D8B0',
  B: '#F2E8A8',
  C: '#E8B0A8',
} as const

export const PASTEL_COLORS = [
  '#A8C8E8', '#A8D8B0', '#F2E8A8', '#E8A8C8',
  '#E8B0A8', '#C8A8E8', '#A8E8D8', '#E8D8A8',
] as const
