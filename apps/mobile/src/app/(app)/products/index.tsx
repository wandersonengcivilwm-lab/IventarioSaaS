import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Q } from '@nozbe/watermelondb'
import { useProducts } from '../../../hooks/useProducts'
import { inventoryCollection, warehousesCollection } from '../../../db'
import { ProductCard } from '../../../components/products/ProductCard'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useAuthStore } from '../../../store/authStore'
import { useSync } from '../../../hooks/useSync'
import { can } from '@inventory-saas/shared'
import type { UserRole } from '@inventory-saas/shared'
import { colors } from '../../../theme/colors'
import { spacing, radius } from '../../../theme/spacing'
import Product from '../../../db/models/Product'

export default function ProductsScreen() {
  const [search, setSearch]             = useState('')
  const [stockMap, setStockMap]         = useState<Record<string, number>>({})
  const { products, loading }           = useProducts(search)
  const { syncing, sync }               = useSync()
  const tenantId                        = useAuthStore(s => s.tenantId)
  const profile                         = useAuthStore(s => s.profile)
  const role                            = profile?.role as UserRole | undefined
  const canCreate                       = role ? can(role, 'create_product') : false

  // Busca o depósito padrão e monta mapa de estoque
  useEffect(() => {
    if (!tenantId || products.length === 0) return

    async function loadStock() {
      const [warehouse] = await warehousesCollection
        .query(Q.where('tenant_id', tenantId!), Q.where('is_default', true))
        .fetch()
      if (!warehouse?.serverId) return

      const items = await inventoryCollection
        .query(Q.where('warehouse_id', warehouse.serverId))
        .fetch()

      const map: Record<string, number> = {}
      for (const item of items) {
        map[item.productId] = item.quantity
      }
      setStockMap(map)
    }

    loadStock()
  }, [products, tenantId])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Produtos</Text>
          <Text style={styles.subtitle}>{products.length} item{products.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => sync()} style={styles.iconBtn} disabled={syncing}>
            <Text style={styles.iconBtnText}>{syncing ? '⏳' : '🔄'}</Text>
          </TouchableOpacity>
          {canCreate && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/products/create')}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ Novo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Busca */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome ou SKU..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blueDark} />
      ) : products.length === 0 ? (
        <EmptyState
          emoji="📦"
          title={search ? 'Nenhum produto encontrado' : 'Nenhum produto ainda'}
          description={search ? 'Tente outro termo de busca.' : 'Crie seu primeiro produto para começar.'}
          action={!search && canCreate ? { label: 'Criar produto', onPress: () => router.push('/(app)/products/create') } : undefined}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              quantity={item.serverId ? (stockMap[item.serverId] ?? 0) : 0}
            />
          )}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  title:         { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle:      { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn:       { padding: spacing.sm },
  iconBtnText:   { fontSize: 20 },
  addBtn:        { backgroundColor: colors.blueDark, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md },
  addBtnText:    { fontSize: 14, fontWeight: '600', color: colors.textInverse },
  searchWrap:    { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  searchInput:   { height: 44, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg, fontSize: 14, color: colors.textPrimary },
})
