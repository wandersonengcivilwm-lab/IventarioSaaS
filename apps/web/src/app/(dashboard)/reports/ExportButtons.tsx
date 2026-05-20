'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ReportType = 'transactions' | 'inventory' | 'abc'
type Format     = 'csv' | 'pdf'

interface TransactionRow {
  created_at:     string
  type:           string
  quantity:       number
  unit_cost:      number | null
  reference:      string | null
  notes:          string | null
  scanned_via_qr: boolean
  products:       { name: string; unit: string; sku: string | null } | null
  warehouses:     { name: string } | null
  users:          { full_name: string } | null
}

interface InventoryRow {
  quantity:      number
  reserved_qty:  number
  updated_at:    string
  products:      { name: string; sku: string | null; unit: string; min_stock: number; cost_price: number | null } | null
  warehouses:    { name: string } | null
}

const TYPE_MAP: Record<string, string> = {
  entry: 'Entrada', exit: 'Saída', adjustment: 'Ajuste',
  transfer_in: 'Transf. entrada', transfer_out: 'Transf. saída',
}

// ─── CSV helpers ──────────────────────────────────────────────
function toCSVCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s
}

function buildCSV(headers: string[], rows: unknown[][]): string {
  return [
    headers.map(toCSVCell).join(','),
    ...rows.map(r => r.map(toCSVCell).join(',')),
  ].join('\r\n')
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const bom = mimeType.includes('csv') ? '﻿' : '' // BOM para Excel abrir UTF-8 corretamente
  const blob = new Blob([bom + content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

// ─── Geração de CSV client-side ───────────────────────────────
async function exportTransactionsCSV(fromDate: string, toDate: string) {
  const supabase = createClient()
  const { data: profile } = await supabase.from('users').select('tenant_id').single()

  const { data } = await supabase
    .from('transactions')
    .select('created_at, type, quantity, unit_cost, reference, notes, scanned_via_qr, products(name, unit, sku), warehouses(name), users(full_name)')
    .eq('tenant_id', profile!.tenant_id)
    .gte('created_at', fromDate)
    .lte('created_at', toDate + 'T23:59:59')
    .order('created_at', { ascending: false })

  const headers = [
    'Data/Hora', 'Tipo', 'Produto', 'SKU', 'Unidade', 'Quantidade',
    'Custo unit.', 'Valor total', 'Depósito', 'Responsável', 'Referência', 'Obs.', 'Via QR',
  ]
  const rows = (data as TransactionRow[] ?? []).map(tx => [
    formatDate(tx.created_at),
    TYPE_MAP[tx.type] ?? tx.type,
    tx.products?.name ?? '',
    tx.products?.sku ?? '',
    tx.products?.unit ?? '',
    tx.quantity,
    tx.unit_cost ?? '',
    tx.unit_cost ? (tx.quantity * tx.unit_cost).toFixed(2) : '',
    tx.warehouses?.name ?? '',
    tx.users?.full_name ?? '',
    tx.reference ?? '',
    tx.notes ?? '',
    tx.scanned_via_qr ? 'Sim' : 'Não',
  ])

  const csv = buildCSV(headers, rows)
  downloadBlob(csv, 'text/csv;charset=utf-8', `movimentacoes-${fromDate}-a-${toDate}.csv`)
  return rows.length
}

async function exportInventoryCSV() {
  const supabase = createClient()
  const { data: profile } = await supabase.from('users').select('tenant_id').single()

  const { data } = await supabase
    .from('inventory_items')
    .select('quantity, reserved_qty, updated_at, products(name, sku, unit, min_stock, cost_price), warehouses(name)')
    .eq('tenant_id', profile!.tenant_id)
    .order('products(name)' as any)

  const headers = [
    'Produto', 'SKU', 'Unidade', 'Depósito', 'Saldo', 'Reservado',
    'Disponível', 'Estoque mín.', 'Status', 'Custo unit.', 'Valor total', 'Atualizado em',
  ]
  const now = new Date().toISOString().slice(0, 10)
  const rows = (data as InventoryRow[] ?? []).map(item => {
    const qty   = item.quantity ?? 0
    const res   = item.reserved_qty ?? 0
    const min   = item.products?.min_stock ?? 0
    const cost  = item.products?.cost_price ?? 0
    const status = qty <= 0 ? 'Sem estoque' : min > 0 && qty <= min ? 'Baixo' : 'Normal'
    return [
      item.products?.name ?? '',
      item.products?.sku ?? '',
      item.products?.unit ?? '',
      item.warehouses?.name ?? '',
      qty,
      res,
      Math.max(0, qty - res),
      min,
      status,
      cost || '',
      cost ? (qty * cost).toFixed(2) : '',
      formatDate(item.updated_at),
    ]
  })

  const csv = buildCSV(headers, rows)
  downloadBlob(csv, 'text/csv;charset=utf-8', `estoque-${now}.csv`)
  return rows.length
}

// ─── Geração de PDF client-side usando jsPDF ──────────────────
async function exportTransactionsPDF(fromDate: string, toDate: string) {
  // Import dinâmico para evitar SSR issues
  const { default: jsPDF }     = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, tenants(name)')
    .single()

  const { data } = await supabase
    .from('transactions')
    .select('created_at, type, quantity, unit_cost, reference, products(name, unit), users(full_name)')
    .eq('tenant_id', (profile as any)!.tenant_id)
    .gte('created_at', fromDate)
    .lte('created_at', toDate + 'T23:59:59')
    .order('created_at', { ascending: false })
    .limit(500)

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Cabeçalho
  doc.setFontSize(16)
  doc.setTextColor(26, 28, 46)
  doc.text('EstoqueApp — Relatório de Movimentações', 14, 16)

  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text(`Empresa: ${(profile as any)?.tenants?.name ?? '—'}`, 14, 23)
  doc.text(`Período: ${fromDate} a ${toDate}`, 14, 28)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 33)

  const tableRows = (data as TransactionRow[] ?? []).map(tx => [
    formatDate(tx.created_at),
    TYPE_MAP[tx.type] ?? tx.type,
    tx.products?.name ?? '—',
    `${tx.quantity} ${tx.products?.unit ?? ''}`,
    tx.unit_cost ? `R$ ${tx.unit_cost.toFixed(2)}` : '—',
    tx.unit_cost ? `R$ ${(tx.quantity * tx.unit_cost).toFixed(2)}` : '—',
    tx.users?.full_name ?? '—',
    tx.reference ?? '—',
  ])

  autoTable(doc, {
    startY: 38,
    head: [['Data/Hora', 'Tipo', 'Produto', 'Quantidade', 'Custo unit.', 'Total', 'Responsável', 'Referência']],
    body: tableRows,
    styles:      { fontSize: 8, cellPadding: 2 },
    headStyles:  { fillColor: [168, 200, 232], textColor: [26, 28, 46], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 248] },
  })

  // Rodapé em cada página
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 8)
  }

  doc.save(`movimentacoes-${fromDate}-a-${toDate}.pdf`)
  return tableRows.length
}

// ─── Componente principal ─────────────────────────────────────
interface ExportButtonsProps {
  fromDate: string
  toDate:   string
}

export function ExportButtons({ fromDate, toDate }: ExportButtonsProps) {
  const [loading, setLoading]   = useState<string | null>(null)
  const [lastCount, setLastCount] = useState<number | null>(null)
  const [lastFile, setLastFile]   = useState('')

  async function handle(key: string, fn: () => Promise<number>, filename: string) {
    setLoading(key)
    try {
      const count = await fn()
      setLastCount(count)
      setLastFile(filename)
    } catch (err: any) {
      alert(`Erro ao exportar: ${err.message ?? err}`)
    } finally {
      setLoading(null)
    }
  }

  const buttons = [
    {
      key:     'tx-csv',
      label:   '📥 Movimentações CSV',
      sub:     'Completo, abre no Excel',
      fn:      () => exportTransactionsCSV(fromDate, toDate),
      file:    `movimentacoes-${fromDate}-a-${toDate}.csv`,
      bg:      '#D4F0DA',
    },
    {
      key:     'tx-pdf',
      label:   '📄 Movimentações PDF',
      sub:     'Formatado para impressão',
      fn:      () => exportTransactionsPDF(fromDate, toDate),
      file:    `movimentacoes-${fromDate}-a-${toDate}.pdf`,
      bg:      '#D4E8F5',
    },
    {
      key:     'inv-csv',
      label:   '📦 Snapshot de Estoque',
      sub:     'Saldo atual por produto',
      fn:      () => exportInventoryCSV(),
      file:    `estoque-${new Date().toISOString().slice(0, 10)}.csv`,
      bg:      '#F9F3D0',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {buttons.map(btn => (
          <button
            key={btn.key}
            onClick={() => handle(btn.key, btn.fn, btn.file)}
            disabled={!!loading}
            className="flex flex-col items-start gap-1.5 p-4 rounded-2xl border border-[#E5E7EB] text-left hover:shadow-md transition-all disabled:opacity-60"
            style={{ backgroundColor: btn.bg }}
          >
            <span className="font-semibold text-[#1A1C2E] text-sm">
              {loading === btn.key ? '⏳ Gerando...' : btn.label}
            </span>
            <span className="text-xs text-[#6B7280]">{btn.sub}</span>
          </button>
        ))}
      </div>

      {lastCount !== null && (
        <div className="flex items-center gap-2 text-sm text-[#5A9468] bg-[#D4F0DA] rounded-xl px-4 py-2.5">
          <span>✓</span>
          <span><strong>{lastCount}</strong> linhas exportadas → <code className="text-xs bg-white px-1.5 py-0.5 rounded">{lastFile}</code></span>
        </div>
      )}
    </div>
  )
}
