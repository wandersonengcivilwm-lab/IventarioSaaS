import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatQuantity(value: number, unit: string): string {
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/\.?0+$/, '')
  return `${formatted} ${unit}`
}

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), "dd/MM/yyyy", { locale: ptBR })
}

export function formatDateTime(isoString: string): string {
  return format(parseISO(isoString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatRelative(isoString: string): string {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true, locale: ptBR })
}

export function transactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    entry:         'Entrada',
    exit:          'Saída',
    adjustment:    'Ajuste',
    transfer_in:   'Transferência (entrada)',
    transfer_out:  'Transferência (saída)',
  }
  return labels[type] ?? type
}

export function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low:    'Baixa',
    medium: 'Média',
    high:   'Alta',
    urgent: 'Urgente',
  }
  return labels[priority] ?? priority
}
