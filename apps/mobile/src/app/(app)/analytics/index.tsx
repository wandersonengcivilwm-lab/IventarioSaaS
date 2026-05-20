import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../../services/supabase'
import { computeABCCurve, formatCurrency, type ABCResult } from '@inventory-saas/shared'
import { useAuthStore } from '../../../store/authStore'
import { EmptyState } from '../../../components/ui/EmptyState'
import { colors } from '../../../theme/colors'
import { spacing, radius } from '../../../theme/spacing'

type Period = 30 | 90 | 180

const ABC_STYLES = {
  A: { bg: colors.greenLight,  text: colors.greenDark,  bar: colors.green,  label: 'Prioritário' },
  B: { bg: colors.yellowLight, text: colors.yellowDark, bar: colors.yellow, label: 'Secundário' },
  C: { bg: colors.errorLight,  text: colors.redDark,    bar: colors.red,    label: 'Baixo giro' },
}

export default function AnalyticsScreen() {
  const tenantId = useAuthStore(s => s.tenantId)
  const [period, setPeriod]     = useState<Period>(90)
  const [results, setResults]   = useState<ABCResult[]>([])
  const [loading, setLoading]   = useState(true)
  const [totalValue, setTotal]  = useState(0)

  useEffect(() => {
    if (!tenantId) return
    loadABC()
  }, [tenantId, period])

  async function loadABC() {
    if (!tenantId) return
    setLoading(true)

    const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('transactions')
      .select('product_id, quantity, unit_cost, products(name)')
      .eq('tenant_id', tenantId)
      .in('type', ['exit', 'transfer_out', 'entry', 'transfer_in'])
      .gte('created_at', since)
      .not('unit_cost', 'is', null)

    const input = (data ?? [])
      .filter((tx: any) => tx.unit_cost && tx.products)
      .map((tx: any) => ({
        product_id:   tx.product_id,
        product_name: (tx.products as any)?.name ?? '—',
        quantity:     tx.quantity,
        unit_cost:    tx.unit_cost,
      }))

    const abc = computeABCCurve(input)
    setResults(abc)
    setTotal(abc.reduce((s, r) => s + r.total_value, 0))
    setLoading(false)
  }

  const countByClass = { A: 0, B: 0, C: 0 }
  for (const r of results) countByClass[r.abc_class]++

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Curva ABC</Text>
        <Text style={styles.subtitle}>{results.length} produtos analisados</Text>
      </View>

      {/* Filtro de período */}
      <View style={styles.periodRow}>
        {([30, 90, 180] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
              {p}d
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.totalLabel}>Total: {formatCurrency(totalValue)}</Text>
      </View>

      {/* Resumo por classe */}
      {results.length > 0 && (
        <View style={styles.summaryRow}>
          {(['A', 'B', 'C'] as const).map(cls => {
            const s = ABC_STYLES[cls]
            return (
              <View key={cls} style={[styles.summaryCard, { backgroundColor: s.bg }]}>
                <Text style={[styles.summaryClass, { color: s.text }]}>Classe {cls}</Text>
                <Text style={styles.summaryCount}>{countByClass[cls]}</Text>
                <Text style={[styles.summaryLabel, { color: s.text }]}>{s.label}</Text>
              </View>
            )
          })}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blueDark} />
      ) : results.length === 0 ? (
        <EmptyState
          emoji="📊"
          title="Sem dados suficientes"
          description={`Registre movimentações com custo unitário nos últimos ${period} dias para ver a Curva ABC.`}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={r => r.product_id}
          renderItem={({ item, index }) => <ABCItem item={item} index={index} totalValue={totalValue} />}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: spacing.sm }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

function ABCItem({ item, index, totalValue }: { item: ABCResult; index: number; totalValue: number }) {
  const s    = ABC_STYLES[item.abc_class]
  const pct  = totalValue > 0 ? (item.total_value / totalValue) * 100 : 0

  return (
    <View style={styles.item}>
      {/* Rank */}
      <Text style={styles.rank}>{index + 1}</Text>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(pct * 5, 100)}%`, backgroundColor: s.bar }]} />
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.itemValue}>{formatCurrency(item.total_value)}</Text>
          <Text style={styles.itemPct}>{item.cumulative_percent.toFixed(1)}% acum.</Text>
        </View>
      </View>

      {/* Badge de classe */}
      <View style={[styles.classBadge, { backgroundColor: s.bg }]}>
        <Text style={[styles.classBadgeText, { color: s.text }]}>{item.abc_class}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  header:             { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md },
  title:              { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle:           { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  periodRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  periodBtn:          { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  periodBtnActive:    { backgroundColor: colors.blueDark, borderColor: colors.blueDark },
  periodBtnText:      { fontSize: 13, color: colors.textSecondary },
  periodBtnTextActive:{ color: colors.textInverse, fontWeight: '600' },
  totalLabel:         { fontSize: 13, color: colors.textMuted, marginLeft: 'auto' },
  summaryRow:         { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  summaryCard:        { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 2 },
  summaryClass:       { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryCount:       { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  summaryLabel:       { fontSize: 10 },
  item:               { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rank:               { width: 24, fontSize: 12, color: colors.textMuted, fontFamily: 'monospace', textAlign: 'right' },
  itemInfo:           { flex: 1, gap: 4 },
  itemName:           { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  barTrack:           { height: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.full, overflow: 'hidden' },
  barFill:            { height: 4, borderRadius: radius.full },
  itemMeta:           { flexDirection: 'row', justifyContent: 'space-between' },
  itemValue:          { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  itemPct:            { fontSize: 11, color: colors.textMuted },
  classBadge:         { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  classBadgeText:     { fontSize: 14, fontWeight: '800' },
})
