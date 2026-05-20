import { useState } from 'react'
import {
  View, Text, StyleSheet, Modal, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useKanban } from '../../../hooks/useKanban'
import { KanbanBoard } from '../../../components/kanban/KanbanBoard'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Button } from '../../../components/ui/Button'
import { colors } from '../../../theme/colors'
import { spacing, radius } from '../../../theme/spacing'
import { KANBAN_PRIORITIES } from '@inventory-saas/shared'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

export default function KanbanScreen() {
  const { stages, cardsByStage, loading, moveCard, createCard } = useKanban()

  const [showModal, setShowModal]         = useState(false)
  const [targetStageId, setTargetStageId] = useState('')
  const [title, setTitle]                 = useState('')
  const [description, setDescription]    = useState('')
  const [priority, setPriority]           = useState<Priority>('medium')
  const [dueDate, setDueDate]             = useState('')
  const [saving, setSaving]              = useState(false)

  function openCreateModal(stageId: string) {
    setTargetStageId(stageId)
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setShowModal(true)
  }

  async function handleCreateCard() {
    if (!title.trim()) {
      Alert.alert('Atenção', 'O título do card é obrigatório.')
      return
    }
    setSaving(true)
    await createCard({
      stageLocalId: targetStageId,
      title:        title.trim(),
      description:  description.trim() || undefined,
      priority,
      dueDate:      dueDate || undefined,
    })
    setSaving(false)
    setShowModal(false)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kanban</Text>
          <Text style={styles.subtitle}>{stages.length} colunas • {Object.values(cardsByStage).flat().length} cards</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blueDark} />
      ) : stages.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="Kanban não configurado"
          description="O quadro Kanban é criado automaticamente ao cadastrar a empresa. Tente sincronizar ou reinicie o app."
        />
      ) : (
        <View style={styles.boardContainer}>
          <KanbanBoard
            stages={stages}
            cardsByStage={cardsByStage}
            onMoveCard={moveCard}
            onAddCard={openCreateModal}
          />
        </View>
      )}

      {/* Modal — criar card */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Novo card</Text>
            <View style={{ width: 64 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalForm}
            keyboardShouldPersistTaps="handled"
          >
            {/* Título */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Título *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Descreva a tarefa..."
                placeholderTextColor={colors.textMuted}
                autoFocus
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Descrição */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: spacing.sm }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detalhes opcionais..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            {/* Prioridade */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Prioridade</Text>
              <View style={styles.priorityGrid}>
                {KANBAN_PRIORITIES.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriority(p.value as Priority)}
                    style={[
                      styles.priorityBtn,
                      priority === p.value && { backgroundColor: p.color + '33', borderColor: p.color },
                    ]}
                  >
                    <Text style={[
                      styles.priorityBtnText,
                      priority === p.value && { color: p.color, fontWeight: '700' },
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Data de vencimento */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Vencimento (AAAA-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="2026-06-30"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <Button
              label="Criar card"
              onPress={handleCreateCard}
              loading={saving}
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  header:        { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:         { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle:      { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  boardContainer:{ flex: 1 },
  modalContainer:{ flex: 1, backgroundColor: colors.background },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalCancel:   { fontSize: 16, color: colors.textSecondary },
  modalTitle:    { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  modalForm:     { padding: spacing.xl, gap: spacing.xl, paddingBottom: 80 },
  field:         { gap: spacing.xs },
  fieldLabel:    { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  input:         { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 15, color: colors.textPrimary, minHeight: 48 },
  priorityGrid:  { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  priorityBtn:   { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border },
  priorityBtnText: { fontSize: 13, color: colors.textSecondary },
})
