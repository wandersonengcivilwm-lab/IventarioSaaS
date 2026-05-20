import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  Alert, TouchableOpacity, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProductSchema, type CreateProductInput, PRODUCT_UNITS } from '@inventory-saas/shared'
import { database, productsCollection } from '../../../db'
import { pushNewProduct } from '../../../services/sync'
import { useCategories } from '../../../hooks/useCategories'
import { useAuthStore } from '../../../store/authStore'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { colors } from '../../../theme/colors'
import { spacing, radius } from '../../../theme/spacing'

export default function CreateProductScreen() {
  const tenantId   = useAuthStore(s => s.tenantId)
  const { categories } = useCategories()
  const [saving, setSaving] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      unit:      'un',
      min_stock: 0,
      is_active: true,
    },
  })

  const selectedUnit = watch('unit')
  const selectedCat  = watch('category_id')

  async function onSubmit(data: CreateProductInput) {
    if (!tenantId) return
    setSaving(true)

    try {
      let localId = ''
      await database.write(async () => {
        const record = await productsCollection.create(r => {
          r.tenantId    = tenantId
          r.name        = data.name
          r.sku         = data.sku ?? null
          r.description = data.description ?? null
          r.unit        = data.unit
          r.categoryId  = data.category_id ?? null
          r.costPrice   = data.cost_price ?? null
          r.salePrice   = data.sale_price ?? null
          r.minStock    = data.min_stock ?? 0
          r.isActive    = isActive
          r.syncedAt    = null
        })
        localId = record.id
      })

      // Tenta sincronizar imediatamente (sem bloquear se offline)
      pushNewProduct(localId).catch(() => {})

      Alert.alert('Produto criado!', 'O produto foi salvo e será sincronizado.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar o produto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Novo produto</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Informações básicas */}
        <SectionTitle>Informações básicas</SectionTitle>

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label="Nome do produto *"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              error={errors.name?.message}
              placeholder="Ex: Farinha de trigo tipo 1"
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="sku"
          render={({ field }) => (
            <Input
              label="SKU / Código interno"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              placeholder="Ex: FAR-001"
              autoCapitalize="characters"
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Input
              label="Descrição"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              placeholder="Descrição opcional"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.sm }}
            />
          )}
        />

        {/* Unidade */}
        <SectionTitle>Unidade de medida</SectionTitle>
        <View style={styles.unitGrid}>
          {PRODUCT_UNITS.map(u => (
            <TouchableOpacity
              key={u.value}
              onPress={() => setValue('unit', u.value)}
              style={[
                styles.unitBtn,
                selectedUnit === u.value && styles.unitBtnActive,
              ]}
            >
              <Text style={[
                styles.unitBtnText,
                selectedUnit === u.value && styles.unitBtnTextActive,
              ]}>
                {u.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categoria */}
        <SectionTitle>Categoria</SectionTitle>
        <View style={styles.catGrid}>
          <TouchableOpacity
            onPress={() => setValue('category_id', undefined)}
            style={[styles.catBtn, !selectedCat && styles.catBtnActive]}
          >
            <Text style={[styles.catBtnText, !selectedCat && styles.catBtnTextActive]}>
              Sem categoria
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setValue('category_id', cat.serverId ?? cat.id)}
              style={[
                styles.catBtn,
                selectedCat === (cat.serverId ?? cat.id) && styles.catBtnActive,
                { borderColor: cat.color },
              ]}
            >
              <Text style={[
                styles.catBtnText,
                selectedCat === (cat.serverId ?? cat.id) && styles.catBtnTextActive,
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preços */}
        <SectionTitle>Preços</SectionTitle>
        <View style={styles.row}>
          <Controller
            control={control}
            name="cost_price"
            render={({ field }) => (
              <Input
                label="Custo (R$)"
                value={field.value?.toString() ?? ''}
                onChangeText={v => field.onChange(v ? parseFloat(v) : null)}
                keyboardType="decimal-pad"
                placeholder="0,00"
                containerStyle={{ flex: 1 }}
              />
            )}
          />
          <Controller
            control={control}
            name="sale_price"
            render={({ field }) => (
              <Input
                label="Venda (R$)"
                value={field.value?.toString() ?? ''}
                onChangeText={v => field.onChange(v ? parseFloat(v) : null)}
                keyboardType="decimal-pad"
                placeholder="0,00"
                containerStyle={{ flex: 1 }}
              />
            )}
          />
        </View>

        {/* Estoque mínimo */}
        <SectionTitle>Estoque</SectionTitle>
        <Controller
          control={control}
          name="min_stock"
          render={({ field }) => (
            <Input
              label="Estoque mínimo (alerta abaixo desse valor)"
              value={field.value?.toString() ?? '0'}
              onChangeText={v => field.onChange(parseInt(v) || 0)}
              keyboardType="numeric"
              placeholder="0"
              hint="Deixe 0 para desativar alertas de estoque baixo"
            />
          )}
        />

        {/* Ativo */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Produto ativo</Text>
            <Text style={styles.switchHint}>Produtos inativos não aparecem nas movimentações</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: colors.border, true: colors.blue }}
            thumbColor={colors.surface}
          />
        </View>

        <Button
          label="Salvar produto"
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  backBtn:            { width: 70 },
  backText:           { fontSize: 16, color: colors.blueDark, fontWeight: '500' },
  title:              { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  form:               { padding: spacing.xl, gap: spacing.lg, paddingBottom: 100 },
  sectionTitle:       { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md },
  row:                { flexDirection: 'row', gap: spacing.md },
  unitGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  unitBtn:            { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  unitBtnActive:      { backgroundColor: colors.blueDark, borderColor: colors.blueDark },
  unitBtnText:        { fontSize: 13, color: colors.textSecondary },
  unitBtnTextActive:  { color: colors.textInverse, fontWeight: '600' },
  catGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catBtn:             { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border },
  catBtnActive:       { backgroundColor: colors.blueLight },
  catBtnText:         { fontSize: 13, color: colors.textSecondary },
  catBtnTextActive:   { color: colors.blueDark, fontWeight: '600' },
  switchRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  switchLabel:        { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  switchHint:         { fontSize: 12, color: colors.textMuted, marginTop: 2 },
})
