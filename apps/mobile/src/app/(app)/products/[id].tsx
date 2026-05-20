import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Q } from '@nozbe/watermelondb'
import { useProductById } from '../../../hooks/useProducts'
import { useTransactions } from '../../../hooks/useTransactions'
import { inventoryCollection, warehousesCollection } from '../../../db'
import { StockBadge } from '../../../components/products/StockBadge'
import { ProductQRCode } from '../../../components/scanner/ProductQRCode'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { colors } from '../../../theme/colors'
import { spacing, radius, shadow } from '../../../theme/spacing'
import { formatCurrency, formatRelative, transactionTypeLabel, TRANSACTION_TYPES } from '@inventory-saas/shared'
import { useAuthStore } from '../../../store/authStore'
import { can } from '@inventory-saas/shared'
import type { UserRole } from '@inventory-saas/shared'

export default function ProductDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>()
  const product    = useProductById(id)
  const tenantId   = useAuthStore(s => s.tenantId)
  const profile    = useAuthStore(s => s.profile)
  const role       = profile?.role as UserRole | undefined
  const canRecord  = role ? can(role, 'record_transaction') : false
  const [showQR, setShowQR] = useState(false)

  const { transactions, loading: txLoading } = useTransactions(
    product?.serverId ?? undefined,
    20,
  )

  const [stockItems, setStockItems] = useState<{ warehouseName: string; quantity: number }[]>([])

  useEffect(() => {
    if (!product?.serverId || !tenantId) return
    async function load() {
      const items = await inventoryCollection
        .query(Q.where('product_id', product!.serverId!))
        .fetch()
      const warehouses = await warehousesCollection
        .query(Q.where('tenant_id', tenantId!))
        .fetch()
      const whMap: Record<string, string> = {}
      for (const w of warehouses) {
        if (w.serverId) whMap[w.serverId] = w.name
      }
      setStockItems(
        items.map(i => ({
          warehouseName: whMap[i.warehouseId] ?? 'Desconhecido',
          quantity:      i.quantity,
        }))
      )
    }
    load()
  }, [product?.serverId, tenantId])

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blueDark} />
      </SafeAreaView>
    )
  }

  const totalStock = stockItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Produtos</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {product?.serverId && (
            <TouchableOpacity onPress={() => setShowQR(true)}>
              <Text style={styles.editBtn}>QR</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => Alert.alert('Em breve', 'Edição disponível em breve.')}>
            <Text style={styles.editBtn}>Editar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>📦</Text>
          </View>
          <Text style={styles.productName}>{product.name}</Text>
          {product.sku && <Text style={styles.sku}>SKU: {product.sku}</Text>}
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
        </View>

        {/* Stock por depósito */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estoque atual</Text>
          {stockItems.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma movimentação registrada ainda.</Text>
            </Card>
          ) : (
            stockItems.map(si => (
              <Card key={si.warehouseName} style={styles.stockCard} padded={false}>
                <View style={styles.stockRow}>
                  <Text style={styles.warehouseName}>{si.warehouseName}</Text>
                  <StockBadge
                    quantity={si.quantity}
                    minStock={product.minStock}
                    unit={product.unit}
                  />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Info financeira */}
        {(product.costPrice || product.salePrice) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preços</Text>
            <View style={styles.priceGrid}>
              {product.costPrice != null && (
                <View style={[styles.priceCard, { backgroundColor: colors.yellowLight }]}>
                  <Text style={styles.priceLabel}>Custo</Text>
                  <Text style={styles.priceValue}>{formatCurrency(product.costPrice)}</Text>
                </View>
              )}
              {product.salePrice != null && (
                <View style={[styles.priceCard, { backgroundColor: colors.greenLight }]}>
                  <Text style={styles.priceLabel}>Venda</Text>
                  <Text style={styles.priceValue}>{formatCurrency(product.salePrice)}</Text>
                </View>
              )}
              {product.costPrice && totalStock > 0 && (
                <View style={[styles.priceCard, { backgroundColor: colors.blueLight }]}>
                  <Text style={styles.priceLabel}>Valor em estoque</Text>
                  <Text style={styles.priceValue}>{formatCurrency(product.costPrice * totalStock)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Ações — apenas para quem pode registrar movimentações */}
        {canRecord && (
          <View style={[styles.section, styles.actionRow]}>
            <Button
              label="📥  Entrada"
              variant="primary"
              onPress={() => router.push({
                pathname: '/(app)/transactions/create',
                params:   { product_local_id: id, type: 'entry' },
              })}
              style={{ flex: 1 }}
            />
            <Button
              label="📤  Saída"
              variant="secondary"
              onPress={() => router.push({
                pathname: '/(app)/transactions/create',
                params:   { product_local_id: id, type: 'exit' },
              })}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {/* Histórico */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <Text style={styles.sectionTitle}>Últimas movimentações</Text>
          {txLoading ? (
            <ActivityIndicator color={colors.blueDark} />
          ) : transactions.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Nenhuma movimentação registrada.</Text>
            </Card>
          ) : (
            transactions.map(tx => {
              const txType = TRANSACTION_TYPES.find(t => t.value === tx.type)
              return (
                <View key={tx.id} style={styles.txItem}>
                  <View style={[styles.txDot, { backgroundColor: txType?.color ?? colors.border }]} />
                  <View style={styles.txInfo}>
                    <Text style={styles.txType}>{transactionTypeLabel(tx.type)}</Text>
                    <Text style={styles.txDate}>{formatRelative(tx.createdAt.toISOString())}</Text>
                    {tx.notes && <Text style={styles.txNotes}>{tx.notes}</Text>}
                  </View>
                  <Text style={[
                    styles.txQty,
                    { color: ['entry','transfer_in'].includes(tx.type) ? colors.greenDark : colors.redDark },
                  ]}>
                    {['entry','transfer_in'].includes(tx.type) ? '+' : '-'}
                    {tx.quantity} {product.unit}
                  </Text>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Modal QR Code */}
      {product?.serverId && (
        <Modal
          visible={showQR}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowQR(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.xl }}>
              <TouchableOpacity onPress={() => setShowQR(false)}>
                <Text style={{ fontSize: 16, color: colors.blueDark, fontWeight: '600' }}>Fechar</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xl }}>
              QR Code do Produto
            </Text>
            <ProductQRCode
              serverProductId={product.serverId}
              productName={product.name}
              unit={product.unit}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  header:        { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  back:          { fontSize: 16, color: colors.blueDark, fontWeight: '500' },
  editBtn:       { fontSize: 16, color: colors.blueDark, fontWeight: '500' },
  hero:          { alignItems: 'center', paddingVertical: spacing['2xl'], paddingHorizontal: spacing.xl, gap: spacing.sm },
  iconWrap:      { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  icon:          { fontSize: 32 },
  productName:   { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  sku:           { fontSize: 13, color: colors.textMuted },
  description:   { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  section:       { paddingHorizontal: spacing.xl, marginBottom: spacing.xl, gap: spacing.sm },
  sectionTitle:  { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stockCard:     { ...shadow.sm },
  stockRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  warehouseName: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  emptyCard:     {},
  emptyText:     { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  priceGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  priceCard:     { flex: 1, minWidth: '45%', padding: spacing.lg, borderRadius: radius.lg, gap: 4 },
  priceLabel:    { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  priceValue:    { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  actionRow:     { flexDirection: 'row', gap: spacing.md },
  txItem:        { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  txDot:         { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  txInfo:        { flex: 1, gap: 2 },
  txType:        { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  txDate:        { fontSize: 12, color: colors.textMuted },
  txNotes:       { fontSize: 12, color: colors.textSecondary },
  txQty:         { fontSize: 15, fontWeight: '700' },
})
