import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Modal, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTransactionSchema, type CreateTransactionInput, TRANSACTION_TYPES, transactionTypeLabel } from '@inventory-saas/shared'
import { Q } from '@nozbe/watermelondb'
import { database, transactionsCollection, productsCollection } from '../../../db'
import { useProducts } from '../../../hooks/useProducts'
import { useWarehouses } from '../../../hooks/useWarehouses'
import { useAuthStore } from '../../../store/authStore'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { colors } from '../../../theme/colors'
import { spacing, radius } from '../../../theme/spacing'

type TransactionType = 'entry' | 'exit' | 'adjustment' | 'transfer_in' | 'transfer_out'

export default function CreateTransactionScreen() {
  const { product_local_id, type: defaultType, qr_product_server_id } = useLocalSearchParams<{
    product_local_id?: string
    type?: string
    qr_product_server_id?: string
  }>()

  const tenantId                     = useAuthStore(s => s.tenantId)
  const { products }                 = useProducts()
  const { warehouses, defaultWarehouse } = useWarehouses()
  const [saving, setSaving]          = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [selectedProductName, setSelectedProductName] = useState('')
  const [selectedProductUnit, setSelectedProductUnit] = useState('un')

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type:           (defaultType as TransactionType) ?? 'entry',
      scanned_via_qr: !!qr_product_server_id,
      warehouse_id:   defaultWarehouse?.id ?? '',
    },
  })

  const selectedType       = watch('type')
  const selectedProductId  = watch('product_id')
  const selectedWarehouseId = watch('warehouse_id')

  // Pré-preenche produto via QR code (server_id) ou por localId de parâmetro
  useEffect(() => {
    async function preselect() {
      if (qr_product_server_id) {
        const [p] = await productsCollection
          .query(Q.where('server_id', qr_product_server_id))
          .fetch()
        if (p) {
          setValue('product_id', p.id)
          setSelectedProductName(p.name)
          setSelectedProductUnit(p.unit)
        }
      } else if (product_local_id) {
        const [p] = await productsCollection
          .query(Q.where('id', product_local_id))
          .fetch()
        if (p) {
          setValue('product_id', p.id)
          setSelectedProductName(p.name)
          setSelectedProductUnit(p.unit)
        }
      }
    }
    preselect()
  }, [product_local_id, qr_product_server_id])

  // Atualiza depósito padrão quando carregado
  useEffect(() => {
    if (defaultWarehouse && !selectedWarehouseId) {
      setValue('warehouse_id', defaultWarehouse.id)
    }
  }, [defaultWarehouse])

  async function onSubmit(data: CreateTransactionInput) {
    if (!tenantId) return

    // Busca o produto local para pegar server_id
    const [localProduct] = await productsCollection
      .query(Q.where('id', data.product_id))
      .fetch()

    // Busca depósito local
    const [localWarehouse] = await warehouses.filter(w => w.id === data.warehouse_id)

    setSaving(true)
    try {
      await database.write(async () => {
        await transactionsCollection.create(r => {
          r.tenantId      = tenantId
          r.productId     = data.product_id
          r.warehouseId   = data.warehouse_id
          r.type          = data.type
          r.quantity      = data.quantity
          r.unitCost      = data.unit_cost ?? null
          r.reference     = data.reference ?? null
          r.notes         = data.notes ?? null
          r.scannedViaQr  = data.scanned_via_qr ?? false
          r.synced        = false
        })
      })

      Alert.alert('Movimentação registrada!', 'Será sincronizada assim que houver conexão.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível registrar a movimentação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nova movimentação</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tipo */}
        <Text style={styles.sectionTitle}>Tipo de movimentação</Text>
        <View style={styles.typeGrid}>
          {TRANSACTION_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setValue('type', t.value as TransactionType)}
              style={[
                styles.typeBtn,
                selectedType === t.value && { backgroundColor: t.color, borderColor: t.color },
              ]}
            >
              <Text style={[
                styles.typeBtnText,
                selectedType === t.value && styles.typeBtnTextActive,
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Produto */}
        <Text style={styles.sectionTitle}>Produto *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, errors.product_id && styles.pickerBtnError]}
          onPress={() => setShowProductPicker(true)}
        >
          <Text style={selectedProductName ? styles.pickerValue : styles.pickerPlaceholder}>
            {selectedProductName || 'Selecionar produto...'}
          </Text>
          <Text style={styles.pickerChevron}>›</Text>
        </TouchableOpacity>
        {errors.product_id && (
          <Text style={styles.errorText}>{errors.product_id.message}</Text>
        )}

        {/* Depósito */}
        <Text style={styles.sectionTitle}>Depósito *</Text>
        <View style={styles.warehouseGrid}>
          {warehouses.map(w => (
            <TouchableOpacity
              key={w.id}
              onPress={() => setValue('warehouse_id', w.id)}
              style={[
                styles.warehouseBtn,
                selectedWarehouseId === w.id && styles.warehouseBtnActive,
              ]}
            >
              <Text style={[
                styles.warehouseBtnText,
                selectedWarehouseId === w.id && styles.warehouseBtnTextActive,
              ]}>
                {w.name} {w.isDefault ? '★' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantidade */}
        <Controller
          control={control}
          name="quantity"
          render={({ field }) => (
            <Input
              label={`Quantidade (${selectedProductUnit})`}
              value={field.value?.toString() ?? ''}
              onChangeText={v => field.onChange(parseFloat(v) || 0)}
              keyboardType="decimal-pad"
              placeholder="0"
              error={errors.quantity?.message}
            />
          )}
        />

        {/* Custo unitário (opcional, para entradas) */}
        {['entry', 'transfer_in'].includes(selectedType) && (
          <Controller
            control={control}
            name="unit_cost"
            render={({ field }) => (
              <Input
                label="Custo unitário (R$) — opcional"
                value={field.value?.toString() ?? ''}
                onChangeText={v => field.onChange(v ? parseFloat(v) : null)}
                keyboardType="decimal-pad"
                placeholder="0,00"
                hint="Usado para calcular o valor total em estoque"
              />
            )}
          />
        )}

        {/* Referência */}
        <Controller
          control={control}
          name="reference"
          render={({ field }) => (
            <Input
              label="Referência / Nota fiscal"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              placeholder="Ex: NF 1234, Pedido #456"
            />
          )}
        />

        {/* Observações */}
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <Input
              label="Observações"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              placeholder="Observações opcionais"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.sm }}
            />
          )}
        />

        <Button
          label="Registrar movimentação"
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>

      {/* Modal de seleção de produto */}
      <Modal visible={showProductPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar produto</Text>
            <TouchableOpacity onPress={() => setShowProductPicker(false)}>
              <Text style={styles.modalClose}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={products}
            keyExtractor={p => p.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.productOption,
                  selectedProductId === item.id && styles.productOptionActive,
                ]}
                onPress={() => {
                  setValue('product_id', item.id)
                  setSelectedProductName(item.name)
                  setSelectedProductUnit(item.unit)
                  setShowProductPicker(false)
                }}
              >
                <View>
                  <Text style={styles.productOptionName}>{item.name}</Text>
                  {item.sku && <Text style={styles.productOptionSku}>SKU: {item.sku}</Text>}
                </View>
                <Text style={styles.productOptionUnit}>{item.unit}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: colors.background },
  header:                 { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  back:                   { fontSize: 16, color: colors.blueDark, fontWeight: '500', width: 70 },
  title:                  { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  form:                   { padding: spacing.xl, gap: spacing.lg, paddingBottom: 100 },
  sectionTitle:           { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  typeGrid:               { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeBtn:                { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  typeBtnText:            { fontSize: 13, color: colors.textSecondary },
  typeBtnTextActive:      { fontWeight: '600', color: colors.textPrimary },
  pickerBtn:              { height: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerBtnError:         { borderColor: colors.error },
  pickerValue:            { fontSize: 15, color: colors.textPrimary },
  pickerPlaceholder:      { fontSize: 15, color: colors.textMuted },
  pickerChevron:          { fontSize: 20, color: colors.textMuted },
  errorText:              { fontSize: 12, color: colors.error },
  warehouseGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  warehouseBtn:           { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  warehouseBtnActive:     { backgroundColor: colors.blueDark, borderColor: colors.blueDark },
  warehouseBtnText:       { fontSize: 13, color: colors.textSecondary },
  warehouseBtnTextActive: { color: colors.textInverse, fontWeight: '600' },
  modalContainer:         { flex: 1, backgroundColor: colors.background },
  modalHeader:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:             { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  modalClose:             { fontSize: 16, color: colors.blueDark },
  productOption:          { padding: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productOptionActive:    { backgroundColor: colors.blueLight },
  productOptionName:      { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  productOptionSku:       { fontSize: 12, color: colors.textMuted },
  productOptionUnit:      { fontSize: 13, color: colors.textSecondary, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  separator:              { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.xl },
})
