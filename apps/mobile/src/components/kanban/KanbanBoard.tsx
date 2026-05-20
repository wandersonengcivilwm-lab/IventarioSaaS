import { useRef, useState, useCallback } from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { KanbanColumn, COLUMN_WIDTH } from './KanbanColumn'
import type KanbanStageModel from '../../db/models/KanbanStage'
import type KanbanCardModel  from '../../db/models/KanbanCard'
import { spacing } from '../../theme/spacing'

interface ColumnLayout {
  x:     number
  width: number
}

interface KanbanBoardProps {
  stages:        KanbanStageModel[]
  cardsByStage:  Record<string, KanbanCardModel[]>
  onMoveCard:    (
    card:        KanbanCardModel,
    targetStage: KanbanStageModel,
    before:      KanbanCardModel | null,
    after:       KanbanCardModel | null,
  ) => void
  onAddCard:     (stageId: string) => void
}

export function KanbanBoard({ stages, cardsByStage, onMoveCard, onAddCard }: KanbanBoardProps) {
  const [draggingCard, setDraggingCard]   = useState<KanbanCardModel | null>(null)
  const [currentDragX, setCurrentDragX]  = useState(0)
  const columnLayouts                     = useRef<Record<string, ColumnLayout>>({})
  const scrollRef                         = useRef<ScrollView>(null)
  const scrollOffset                      = useRef(0)

  const handleLayout = useCallback((stageId: string, x: number, width: number) => {
    columnLayouts.current[stageId] = { x, width }
  }, [])

  const handleDragStart = useCallback((card: KanbanCardModel, _pageY: number, pageX: number) => {
    setDraggingCard(card)
    setCurrentDragX(pageX)
  }, [])

  const handleDragMove = useCallback((pageX: number, _pageY: number) => {
    setCurrentDragX(pageX)

    // Auto-scroll horizontal quando próximo das bordas
    const SCROLL_ZONE = 60
    const SCROLL_SPEED = 8
    if (pageX < SCROLL_ZONE) {
      scrollRef.current?.scrollTo({ x: Math.max(0, scrollOffset.current - SCROLL_SPEED), animated: false })
    } else if (pageX > 400 - SCROLL_ZONE) { // threshold aproximado
      scrollRef.current?.scrollTo({ x: scrollOffset.current + SCROLL_SPEED, animated: false })
    }
  }, [])

  const handleDragEnd = useCallback((card: KanbanCardModel) => {
    setDraggingCard(null)

    // Determina qual coluna o card foi solto baseado na posição X absoluta
    let targetStage: KanbanStageModel | null = null
    for (const stage of stages) {
      const layout = columnLayouts.current[stage.id]
      if (!layout) continue
      if (currentDragX >= layout.x && currentDragX <= layout.x + layout.width) {
        targetStage = stage
        break
      }
    }

    // Se nenhuma coluna foi detectada, mantém na coluna atual
    if (!targetStage) return
    // Se não mudou de coluna e não há necessidade de reordenação, ignora
    if (targetStage.id === card.stageId) return

    // Insere no final da coluna de destino
    const targetCards = cardsByStage[targetStage.id] ?? []
    const before      = targetCards.at(-1) ?? null
    onMoveCard(card, targetStage, before, null)
  }, [stages, cardsByStage, currentDragX, onMoveCard])

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.x }}
      contentContainerStyle={styles.board}
    >
      {stages.map((stage) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          cards={cardsByStage[stage.id] ?? []}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          draggingCard={draggingCard}
          onAddCard={onAddCard}
          onLayout={handleLayout}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  board: {
    paddingHorizontal: spacing.xl,
    paddingVertical:   spacing.lg,
  },
})
