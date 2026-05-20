import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { buildQRPayload } from './QRScanner'
import { colors } from '../../theme/colors'
import { spacing, radius, shadow } from '../../theme/spacing'

interface ProductQRCodeProps {
  serverProductId: string
  productName:     string
  unit:            string
}

export function ProductQRCode({ serverProductId, productName, unit }: ProductQRCodeProps) {
  const payload = buildQRPayload(serverProductId)

  async function handleShare() {
    try {
      await Share.share({
        message: `Produto: ${productName}\nCódigo QR: ${payload}`,
        title:   `QR Code — ${productName}`,
      })
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar o QR Code.')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.qrWrap}>
        <QRCode
          value={payload}
          size={180}
          color={colors.textPrimary}
          backgroundColor={colors.surface}
          quietZone={12}
        />
      </View>
      <Text style={styles.productName}>{productName}</Text>
      <Text style={styles.payload}>{payload}</Text>
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareText}>Compartilhar QR Code</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  qrWrap:      { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.xl, ...shadow.md, borderWidth: 1, borderColor: colors.border },
  productName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  payload:     { fontSize: 10, color: colors.textMuted, fontFamily: 'monospace' },
  shareBtn:    { backgroundColor: colors.blueLight, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  shareText:   { fontSize: 14, fontWeight: '600', color: colors.blueDark },
})
