import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Product from '../../db/models/Product'
import { StockBadge } from './StockBadge'
import { Card } from '../ui/Card'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'

interface ProductCardProps {
  product:      Product
  quantity?:    number
  categoryName?: string
}

export function ProductCard({ product, quantity = 0, categoryName }: ProductCardProps) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/products/${product.id}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.card} padded={false}>
        <View style={styles.inner}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>📦</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
            {categoryName && (
              <Text style={styles.category}>{categoryName}</Text>
            )}
            {product.sku && (
              <Text style={styles.sku}>SKU: {product.sku}</Text>
            )}
            <View style={styles.stockRow}>
              <StockBadge
                quantity={quantity}
                minStock={product.minStock}
                unit={product.unit}
              />
            </View>
          </View>

          <View style={styles.chevron}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.xl,
    marginBottom:     spacing.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       spacing.lg,
    gap:           spacing.md,
  },
  iconWrap: {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: colors.blueLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    gap:  4,
  },
  name: {
    fontSize:   15,
    fontWeight: '600',
    color:      colors.textPrimary,
  },
  category: {
    fontSize: 12,
    color:    colors.textMuted,
  },
  sku: {
    fontSize: 12,
    color:    colors.textMuted,
  },
  stockRow: {
    marginTop: 4,
  },
  chevron: {
    paddingLeft: spacing.sm,
  },
  chevronText: {
    fontSize: 22,
    color:    colors.textMuted,
  },
})
