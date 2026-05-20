import { useRef } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import type KanbanCardModel from '../../db/models/KanbanCard'
import { colors } from '../../theme/colors'
import { spacing, radius, shadow } from '../../theme/spacing'
import { KANBAN_PRIORITIES } from '@inventory-saas/shared'

interface KanbanCardProps {
  card:         KanbanCardModel
  onDragStart:  (card: KanbanCardModel, pageY: number, pageX: number) => void
  onDragMove:   (pageX: number, pageY: number) => void
  onDragEnd:    (card: KanbanCardModel) => void
  isDragging?:  boolean
}

const PRIORITY_COLORS: Record<string, string> = {
  low:    colors.textMuted,
  medium: colors.yellowDark,
  high:   '#F97316',
  urgent: colors.redDark,
}

export function KanbanCard({ card, onDragStart, onDragMove, onDragEnd, isDragging }: KanbanCardProps) {
  const scale    = useSharedValue(1)
  const opacity  = useSharedValue(1)
  const isDrag   = useSharedValue(false)

  const animStyle = useAnimatedStyle(() => ({
    transform:    [{ scale: scale.value }],
    opacity:      opacity.value,
    zIndex:       isDrag.value ? 100 : 1,
    shadowOpacity: isDrag.value ? 0.2 : 0.05,
  }))

  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart((e) => {
      'worklet'
      isDrag.value  = true
      scale.value   = withSpring(1.04, { damping: 15 })
      opacity.value = withSpring(0.9)
      runOnJS(onDragStart)(card, e.absoluteY, e.absoluteX)
    })
    .onUpdate((e) => {
      'worklet'
      runOnJS(onDragMove)(e.absoluteX, e.absoluteY)
    })
    .onEnd(() => {
      'worklet'
      isDrag.value  = false
      scale.value   = withSpring(1, { damping: 15 })
      opacity.value = withSpring(1)
      runOnJS(onDragEnd)(card)
    })
    .onFinalize(() => {
      'worklet'
      isDrag.value  = false
      scale.value   = withSpring(1, { damping: 15 })
      opacity.value = withSpring(1)
    })

  const priorityColor = PRIORITY_COLORS[card.priority] ?? colors.textMuted
  const priorityLabel = KANBAN_PRIORITIES.find(p => p.value === card.priority)?.label ?? card.priority

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animStyle, isDragging && styles.dragging]}>
        {/* Barra de prioridade à esquerda */}
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{card.title}</Text>

          {card.description ? (
            <Text style={styles.description} numberOfLines={1}>{card.description}</Text>
          ) : null}

          <View style={styles.footer}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '22' }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
            </View>

            {card.dueDate ? (
              <Text style={[
                styles.dueDate,
                isOverdue(card.dueDate) && styles.dueDateOverdue,
              ]}>
                📅 {formatDueDate(card.dueDate)}
              </Text>
            ) : null}

            {!card.synced && (
              <Text style={styles.syncPending}>⏳</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

function isOverdue(dueDateStr: string): boolean {
  return new Date(dueDateStr) < new Date()
}

function formatDueDate(dueDateStr: string): string {
  const d = new Date(dueDateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const styles = StyleSheet.create({
  card: {
    backgroundColor:  colors.surface,
    borderRadius:     radius.md,
    marginHorizontal: spacing.md,
    marginBottom:     spacing.sm,
    flexDirection:    'row',
    borderWidth:      1,
    borderColor:      colors.border,
    ...shadow.sm,
    overflow:         'hidden',
  },
  dragging: {
    ...shadow.lg,
    borderColor: colors.blue,
  },
  priorityBar: {
    width: 4,
  },
  content: {
    flex:    1,
    padding: spacing.md,
    gap:     spacing.xs,
  },
  title: {
    fontSize:   14,
    fontWeight: '600',
    color:      colors.textPrimary,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color:    colors.textSecondary,
  },
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.sm,
    flexWrap:       'wrap',
    marginTop:      spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    borderRadius:      radius.full,
  },
  priorityText: {
    fontSize:   10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dueDate: {
    fontSize: 11,
    color:    colors.textMuted,
  },
  dueDateOverdue: {
    color: colors.redDark,
    fontWeight: '600',
  },
  syncPending: {
    fontSize: 11,
    marginLeft: 'auto',
  },
})
