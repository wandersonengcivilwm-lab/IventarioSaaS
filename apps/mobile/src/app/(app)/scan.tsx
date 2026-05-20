import { useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Vibration,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useCameraPermission } from 'react-native-vision-camera'
import { QRScanner } from '../../components/scanner/QRScanner'
import { useQRLookup } from '../../hooks/useQRLookup'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

type ScanState = 'scanning' | 'found' | 'notFound' | 'loading' | 'paused'

export default function ScanScreen() {
  const { hasPermission, requestPermission } = useCameraPermission()
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [torch, setTorch]         = useState(false)
  const pulseAnim                 = useRef(new Animated.Value(1)).current
  const { result, lookup, reset: resetLookup } = useQRLookup()

  function startPulse() {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start()
  }

  const handleScan = useCallback(async (raw: string) => {
    if (scanState !== 'scanning') return
    setScanState('loading')
    Vibration.vibrate(50)
    startPulse()

    await lookup(raw)
  }, [scanState, lookup])

  // Sincroniza o estado local com o resultado do hook
  const scannedProduct = result.status === 'found' ? result.product : null
  const rawCode        = result.status === 'notFound' ? result.raw : ''

  if (result.status === 'found' && scanState === 'loading') setScanState('found')
  if (result.status === 'notFound' && scanState === 'loading') setScanState('notFound')

  function reset() {
    resetLookup()
    setScanState('scanning')
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permEmoji}>📷</Text>
          <Text style={styles.permTitle}>Permissão de câmera</Text>
          <Text style={styles.permDesc}>
            O EstoqueApp precisa acessar a câmera para escanear os QR codes dos produtos.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir câmera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.fullScreen}>
      {/* Câmera full-screen */}
      <QRScanner
        onScan={handleScan}
        isActive={scanState === 'scanning'}
        torch={torch}
      />

      {/* Overlay escuro com buraco central */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <Animated.View style={[styles.viewfinder, { transform: [{ scale: pulseAnim }] }]}>
            {/* Cantos do viewfinder */}
            {[
              { top: 0, left: 0,   borderTopWidth: 3, borderLeftWidth: 3 },
              { top: 0, right: 0,  borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: 0, left: 0,  borderBottomWidth: 3, borderLeftWidth: 3 },
              { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
            ].map((corner, i) => (
              <View key={i} style={[styles.corner, corner, {
                borderColor: scanState === 'found' ? colors.green : scanState === 'notFound' ? colors.red : '#FFFFFF',
              }]} />
            ))}
          </Animated.View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear produto</Text>
        <TouchableOpacity onPress={() => setTorch(t => !t)} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{torch ? '🔦' : '💡'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Instrução central */}
      {scanState === 'scanning' && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Aponte para o QR Code do produto</Text>
        </View>
      )}

      {/* Painel inferior de resultado */}
      {(scanState === 'found' || scanState === 'notFound') && (
        <View style={styles.resultPanel}>
          {scanState === 'found' && scannedProduct ? (
            <>
              <View style={styles.resultIcon}>
                <Text style={{ fontSize: 28 }}>✅</Text>
              </View>
              <Text style={styles.resultTitle}>{scannedProduct.name}</Text>
              <Text style={styles.resultSub}>Produto encontrado</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={[styles.resultBtn, styles.resultBtnPrimary]}
                  onPress={() => {
                    reset()
                    router.push({
                      pathname: '/(app)/transactions/create',
                      params: {
                        product_local_id: scannedProduct.id,
                        type:             'entry',
                        qr_product_server_id: scannedProduct.id,
                      },
                    })
                  }}
                >
                  <Text style={styles.resultBtnPrimaryText}>📥 Entrada</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resultBtn, styles.resultBtnSecondary]}
                  onPress={() => {
                    reset()
                    router.push({
                      pathname: '/(app)/transactions/create',
                      params: {
                        product_local_id: scannedProduct.id,
                        type:             'exit',
                        qr_product_server_id: scannedProduct.id,
                      },
                    })
                  }}
                >
                  <Text style={styles.resultBtnSecondaryText}>📤 Saída</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => {
                  reset()
                  router.push(`/(app)/products/${scannedProduct.id}`)
                }}
                style={styles.resultLink}
              >
                <Text style={styles.resultLinkText}>Ver detalhes do produto →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={reset} style={styles.scanAgainBtn}>
                <Text style={styles.scanAgainText}>Escanear outro</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.resultIcon}>
                <Text style={{ fontSize: 28 }}>❓</Text>
              </View>
              <Text style={styles.resultTitle}>Produto não encontrado</Text>
              <Text style={styles.resultSub} numberOfLines={2}>{rawCode}</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={[styles.resultBtn, styles.resultBtnPrimary]}
                  onPress={() => {
                    reset()
                    router.push('/(app)/products/create')
                  }}
                >
                  <Text style={styles.resultBtnPrimaryText}>+ Criar produto</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={reset} style={styles.scanAgainBtn}>
                <Text style={styles.scanAgainText}>Escanear novamente</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  )
}

const VIEWFINDER_SIZE = 240
const OVERLAY_COLOR  = 'rgba(0,0,0,0.6)'

const styles = StyleSheet.create({
  fullScreen:        { flex: 1, backgroundColor: '#000' },
  container:         { flex: 1, backgroundColor: colors.background },
  permissionBox:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['3xl'], gap: spacing.lg },
  permEmoji:         { fontSize: 56 },
  permTitle:         { fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  permDesc:          { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  permBtn:           { backgroundColor: colors.blueDark, paddingHorizontal: spacing['2xl'], paddingVertical: spacing.lg, borderRadius: radius.md, marginTop: spacing.md },
  permBtnText:       { fontSize: 15, fontWeight: '600', color: '#fff' },
  header:            { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  headerBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  headerBtnText:     { fontSize: 18, color: '#fff' },
  headerTitle:       { fontSize: 16, fontWeight: '600', color: '#fff' },
  overlayTop:        { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddle:     { flexDirection: 'row', height: VIEWFINDER_SIZE },
  overlaySide:       { flex: 1, backgroundColor: OVERLAY_COLOR },
  viewfinder:        { width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE },
  corner:            { position: 'absolute', width: 24, height: 24, borderColor: '#fff' },
  overlayBottom:     { flex: 1, backgroundColor: OVERLAY_COLOR },
  hint:              { position: 'absolute', bottom: 200, left: 0, right: 0, alignItems: 'center' },
  hintText:          { color: '#fff', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },
  resultPanel:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing['2xl'], paddingBottom: 48, alignItems: 'center', gap: spacing.md },
  resultIcon:        { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  resultTitle:       { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  resultSub:         { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  resultActions:     { flexDirection: 'row', gap: spacing.md, width: '100%' },
  resultBtn:         { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  resultBtnPrimary:  { backgroundColor: colors.blueDark },
  resultBtnPrimaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  resultBtnSecondary:   { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  resultBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  resultLink:        { paddingVertical: spacing.xs },
  resultLinkText:    { fontSize: 13, color: colors.blueDark },
  scanAgainBtn:      { paddingVertical: spacing.sm },
  scanAgainText:     { fontSize: 14, color: colors.textMuted },
})
