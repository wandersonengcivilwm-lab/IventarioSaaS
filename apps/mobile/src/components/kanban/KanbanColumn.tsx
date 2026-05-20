import { useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { KanbanCard } from './KanbanCard'
import type KanbanStageModel from '../../db/models/KanbanStage'
import type KanbanCardModel  from '../../db/models/KanbanCard'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

const COLUMN_WIDTH = 240

interface KanbanColumnProps {
  stage:        KanbanStageModel
  cards:        KanbanCardModel[]
  onDragStart:  (card: KanbanCardModel, pageY: number, pageX: number) => void
  onDragMove:   (pageX: number, pageY: number) => void
  onDragEnd:    (card: KanbanCardModel) => void
  draggingCard: KanbanCardModel | null
  onAddCard:    (stageId: string) => void
  onLayout:     (stageId: string, x: number, width: number) => void
}

export function KanbanColumn({
  stage,
  cards,
  onDragStart,
  onDragMove,
  onDragEnd,
  draggingCard,
  onAddCard,
  onLayout,
}: KanbanColumnProps) {
  return (
    <View
      style={styles.column}
      onLayout={(e) => {
        e.target.measure((_x, _y, _w, _h, pageX, _pageY) => {
          onLayout(stage.id, pageX, COLUMN_WIDTH)
        })
      }}
    >
      {/* Header da coluna */}
      <View style={[styles.header, { borderColor: stage.color }]}>
        <View style={[styles.colorDot, { backgroundColor: stage.color }]} />
        <Text style={styles.stageName} numberOfLines={1}>{stage.name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{cards.length}</Text>
        </View>
      </View>

      {/* Cards */}
      <ScrollView
        style={styles.cardList}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!draggingCard}
        contentContainerStyle={{ paddingVertical: spacing.sm }}
      >
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            isDragging={draggingCard?.id === card.id}
          />
        ))}
      </ScrollView>

      {/* Adicionar card */}
      {!stage.isTerminal && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onAddCard(stage.id)}
        >
          <Text style={styles.addBtnText}>+ Adicionar card</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  column: {
    width:           COLUMN_WIDTH,
    backgroundColor: colors.surfaceAlt,
    borderRadius:    radius.xl,
    marginRight:     spacing.lg,
    overflow:        'hidden',
    maxHeight:       '100%',
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    padding:         spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  colorDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
  },
  stageName: {
    flex:       1,
    fontSize:   14,
    fontWeight: '700',
    color:      colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.border,
    borderRadius:    radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countText: {
    fontSize:   11,
    fontWeight: '600',
    color:      colors.textSecondary,
  },
  cardList: {
    flex: 1,
  },
  addBtn: {
    margin:        spacing.md,
    paddingVertical: spacing.md,
    alignItems:    'center',
    borderWidth:   1,
    borderColor:   colors.border,
    borderStyle:   'dashed',
    borderRadius:  radius.md,
  },
  addBtnText: {
    fontSize: 13,
    color:    colors.textSecondary,
  },
})

export { COLUMN_WIDTH }
