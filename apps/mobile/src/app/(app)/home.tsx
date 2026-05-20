import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import { can } from '@inventory-saas/shared'
import type { UserRole } from '@inventory-saas/shared'
import { colors } from '../../theme/colors'
import { spacing, radius, shadow } from '../../theme/spacing'
import { formatCurrency } from '@inventory-saas/shared'
import { NotificationBell } from '../../components/notifications/NotificationBell'

interface Stats {
  totalProducts: number
  totalValue: number
  lowStockCount: number
  todayTransactions: number
}

export default function HomeScreen() {
  const profile = useAuthStore(s => s.profile)
  const tenantId = useAuthStore(s => s.tenantId)
  const [stats, setStats]         = useState<Stats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function loadStats() {
    if (!tenantId) return

    const [productsRes, inventoryRes, notifRes, txRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).eq('is_active', true),
      supabase.from('inventory_items').select('quantity, products(cost_price)')
        .eq('tenant_id', tenantId),
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).is('read_at', null).eq('type', 'low_stock'),
      supabase.from('transactions').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).gte('created_at', new Date().toISOString().split('T')[0]),
    ])

    const totalValue = (inventoryRes.data ?? []).reduce((sum: number, item: any) => {
      return sum + (item.quantity ?? 0) * (item.products?.cost_price ?? 0)
    }, 0)

    setStats({
      totalProducts:     productsRes.count ?? 0,
      totalValue,
      lowStockCount:     notifRes.count ?? 0,
      todayTransactions: txRes.count ?? 0,
    })
  }

  useEffect(() => { loadStats() }, [tenantId])

  async function onRefresh() {
    setRefreshing(true)
    await loadStats()
    setRefreshing(false)
  }

  const firstName  = profile?.full_name?.split(' ')[0] ?? 'Usuário'
  const role       = profile?.role as UserRole | undefined
  const canRecord  = role ? can(role, 'record_transaction') : false
  const canCreate  = role ? can(role, 'create_product') : false

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <NotificationBell />
            <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            emoji="📦"
            label="Produtos ativos"
            value={stats?.totalProducts.toString() ?? '—'}
            color={colors.blueLight}
          />
          <StatCard
            emoji="💰"
            label="Valor em estoque"
            value={stats ? formatCurrency(stats.totalValue) : '—'}
            color={colors.greenLight}
          />
          <StatCard
            emoji="⚠️"
            label="Estoque baixo"
            value={stats?.lowStockCount.toString() ?? '—'}
            color={stats?.lowStockCount ? colors.errorLight : colors.greenLight}
          />
          <StatCard
            emoji="🔄"
            label="Movim. hoje"
            value={stats?.todayTransactions.toString() ?? '—'}
            color={colors.yellowLight}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <View style={styles.actionsGrid}>
            {[
              { emoji: '📷', label: 'Escanear QR',  onPress: () => router.push('/(app)/scan'),                    show: canRecord },
              { emoji: '📥', label: 'Entrada',       onPress: () => router.push('/(app)/transactions/create'),     show: canRecord },
              { emoji: '📤', label: 'Saída',         onPress: () => router.push('/(app)/transactions/create'),     show: canRecord },
              { emoji: '🔍', label: 'Ver produtos',  onPress: () => router.push('/(app)/products/index'),          show: true },
              { emoji: '📊', label: 'Análise ABC',   onPress: () => router.push('/(app)/analytics/index'),         show: true },
              { emoji: '➕', label: 'Novo produto',  onPress: () => router.push('/(app)/products/create'),         show: canCreate },
            ].filter(a => a.show).map(action => (
              <TouchableOpacity key={action.label} style={styles.actionCard} onPress={action.onPress}>
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ emoji, label, value, color }: {
  emoji: string; label: string; value: string; color: string
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 13, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  signOutBtn: { padding: spacing.sm },
  signOutText: { fontSize: 13, color: colors.textSecondary },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingBottom: spacing.xl,
  },
  statCard: {
    width: '47%', borderRadius: radius.lg, padding: spacing.lg,
    ...shadow.sm,
  },
  statEmoji: { fontSize: 24, marginBottom: spacing.sm },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.lg },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  actionEmoji: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
})
