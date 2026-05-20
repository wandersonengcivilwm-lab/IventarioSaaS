import { useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTransactions } from '../../../hooks/useTransactions'
import { useExport } from '../../../hooks/useExport'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useAuthStore } from '../../../store/authStore'
import { can } from '@inventory-saas/shared'
import type { UserRole } from '@inventory-saas/shared'
import { colors } from '../../../theme/colors'
import { spacing, radius } from '../../../theme/spacing'
import { transactionTypeLabel, formatRelative, TRANSACTION_TYPES } from '@inventory-saas/shared'
import Transaction from '../../../db/models/Transaction'

export default function TransactionsScreen() {
  const { transactions, loading } = useTransactions(undefined, 100)
  const profile   = useAuthStore(s => s.profile)
  const role      = profile?.role as UserRole | undefined
  const canRecord = role ? can(role, 'record_transaction') : false
  const canExport = role ? can(role, 'export_report') : false
  const { exportReport, loading: exporting, progress } = useExport()

  async function handleExport() {
    const ago30d = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10)
    const today  = new Date().toISOString().slice(0, 10)
    const result = await exportReport({ report: 'transactions', from_date: ago30d, to_date: today })
    if (!result.success) {
      Alert.alert('Erro ao exportar', result.error ?? 'Tente novamente.')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Movimentações</Text>
          <Text style={styles.subtitle}>{transactions.length} registro{transactions.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {canExport && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.greenDark }]}
              onPress={handleExport}
              disabled={exporting}
            >
              <Text style={styles.addBtnText}>{exporting ? progress || '⏳' : '📤 CSV'}</Text>
            </TouchableOpacity>
          )}
          {canRecord && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(app)/transactions/create')}
            >
              <Text style={styles.addBtnText}>+ Nova</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blueDark} />
      ) : transactions.length === 0 ? (
        <EmptyState
          emoji="🔄"
          title="Nenhuma movimentação"
          description="Registre a primeira entrada ou saída de produto."
          action={canRecord ? { label: 'Nova movimentação', onPress: () => router.push('/(app)/transactions/create') } : undefined}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={tx => tx.id}
          renderItem={({ item }) => <TransactionItem tx={item} />}
          contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

function TransactionItem({ tx }: { tx: Transaction }) {
  const txType = TRANSACTION_TYPES.find(t => t.value === tx.type)
  const isEntry = ['entry', 'transfer_in'].includes(tx.type)

  return (
    <View style={styles.txItem}>
      <View style={[styles.txDot, { backgroundColor: txType?.color ?? colors.border }]} />
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{transactionTypeLabel(tx.type)}</Text>
        <Text style={styles.txDate}>{formatRelative(tx.createdAt.toISOString())}</Text>
        {tx.reference && <Text style={styles.txRef}>Ref: {tx.reference}</Text>}
        {!tx.synced && <Text style={styles.pending}>⏳ Pendente sync</Text>}
      </View>
      <Text style={[styles.txQty, { color: isEntry ? colors.greenDark : colors.redDark }]}>
        {isEntry ? '+' : '-'}{tx.quantity}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  title:      { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle:   { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addBtn:     { backgroundColor: colors.blueDark, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md },
  addBtnText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
  txItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  txDot:      { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  txInfo:     { flex: 1, gap: 2 },
  txType:     { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  txDate:     { fontSize: 12, color: colors.textMuted },
  txRef:      { fontSize: 12, color: colors.textSecondary },
  pending:    { fontSize: 11, color: colors.warning },
  txQty:      { fontSize: 16, fontWeight: '700' },
})
