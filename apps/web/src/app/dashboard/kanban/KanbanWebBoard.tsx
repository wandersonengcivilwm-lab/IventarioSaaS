'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  low:    { bg: '#F3F4F6', text: '#6B7280',  border: '#E5E7EB' },
  medium: { bg: '#FEF3C7', text: '#D97706',  border: '#F2E8A8' },
  high:   { bg: '#FFEDD5', text: '#C2410C',  border: '#FDBA74' },
  urgent: { bg: '#FEE2E2', text: '#B91C1C',  border: '#FCA5A5' },
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
}

interface Stage {
  id: string; name: string; color: string; position: number; is_terminal: boolean;
}

interface Card {
  id: string; stage_id: string; title: string; description?: string; priority: string;
  due_date?: string; position: number; products?: { name: string; unit: string } | null;
  users?: { full_name: string } | null;
}

interface KanbanWebBoardProps {
  stages:       Stage[]
  cardsByStage: Record<string, Card[]>
  tenantId:     string
  userRole:     string
}

export function KanbanWebBoard({ stages, cardsByStage, tenantId, userRole }: KanbanWebBoardProps) {
  const supabase                    = createClient()
  const [localCards, setLocalCards] = useState(cardsByStage)
  const [isPending, startTransition] = useTransition()
  const [movingCardId, setMovingCardId] = useState<string | null>(null)

  const canEdit = ['owner', 'admin', 'operator'].includes(userRole)

  async function moveCard(cardId: string, toStageId: string) {
    if (!canEdit || movingCardId) return
    setMovingCardId(cardId)

    // Encontra o card e estágio atual
    let card: Card | null = null
    let fromStageId = ''
    for (const [sid, cards] of Object.entries(localCards)) {
      const found = cards.find(c => c.id === cardId)
      if (found) { card = found; fromStageId = sid; break }
    }
    if (!card || fromStageId === toStageId) { setMovingCardId(null); return }

    // Posição no final da coluna destino
    const targetCards = localCards[toStageId] ?? []
    const newPosition = (targetCards.at(-1)?.position ?? 0) + 1

    // Otimismo: atualiza UI imediatamente
    setLocalCards(prev => {
      const updated = { ...prev }
      updated[fromStageId] = updated[fromStageId].filter(c => c.id !== cardId)
      updated[toStageId]   = [...(updated[toStageId] ?? []), { ...card!, stage_id: toStageId, position: newPosition }]
      return updated
    })

    // Persiste no Supabase
    const { error } = await supabase
      .from('kanban_cards')
      .update({ stage_id: toStageId, position: newPosition })
      .eq('id', cardId)

    if (error) {
      // Reverte em caso de erro
      setLocalCards(cardsByStage)
      console.error('[Kanban] Move error:', error.message)
    }
    setMovingCardId(null)
  }

  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9CA3AF]">
        <div className="text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-semibold text-[#1A1C2E]">Kanban não configurado</p>
          <p className="text-sm mt-2">O quadro Kanban é criado automaticamente no primeiro login.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {stages.map(stage => {
        const cards = localCards[stage.id] ?? []
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-64 bg-[#F3F4F6] rounded-2xl flex flex-col max-h-full overflow-hidden"
          >
            {/* Header da coluna */}
            <div
              className="flex items-center gap-2 p-4 border-b-2"
              style={{ borderColor: stage.color }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="flex-1 text-sm font-bold text-[#1A1C2E] truncate">{stage.name}</span>
              <span className="text-xs bg-white text-[#6B7280] px-2 py-0.5 rounded-full font-medium">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {cards.map(card => {
                const ps = PRIORITY_STYLES[card.priority] ?? PRIORITY_STYLES.medium
                const isOverdue = card.due_date && new Date(card.due_date) < new Date()
                return (
                  <div
                    key={card.id}
                    className={`bg-white rounded-xl border p-3 shadow-sm transition-opacity ${
                      movingCardId === card.id ? 'opacity-40' : ''
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#1A1C2E] leading-snug mb-1">
                      {card.title}
                    </p>
                    {card.description && (
                      <p className="text-xs text-[#9CA3AF] mb-2 line-clamp-2">{card.description}</p>
                    )}
                    {card.products && (
                      <p className="text-xs text-[#6B7280] mb-2">📦 {card.products.name}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium border"
                        style={{ backgroundColor: ps.bg, color: ps.text, borderColor: ps.border }}
                      >
                        {PRIORITY_LABELS[card.priority]}
                      </span>
                      {card.due_date && (
                        <span className={`text-xs ${isOverdue ? 'text-[#C05040] font-semibold' : 'text-[#9CA3AF]'}`}>
                          📅 {new Date(card.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Mover para outra coluna */}
                    {canEdit && stages.length > 1 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {stages
                          .filter(s => s.id !== stage.id)
                          .map(s => (
                            <button
                              key={s.id}
                              onClick={() => moveCard(card.id, s.id)}
                              disabled={!!movingCardId}
                              className="text-xs px-2 py-1 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
                            >
                              → {s.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {cards.length === 0 && (
                <div className="text-center py-8 text-[#9CA3AF] text-xs">
                  Nenhum card
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
