import { useEffect, useRef, useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  type CodeType,
} from 'react-native-vision-camera'
import { colors } from '../../theme/colors'

// Formato do payload interno: inv:{server_product_id}
const QR_PREFIX = 'inv:'
const ACCEPTED_CODE_TYPES: CodeType[] = ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39', 'data-matrix']

// Debounce: ignora scans duplicados por 2 segundos
let lastScannedValue = ''
let lastScannedAt = 0

interface QRScannerProps {
  onScan:       (value: string) => void
  isActive:     boolean
  torch?:       boolean
}

export function QRScanner({ onScan, isActive, torch = false }: QRScannerProps) {
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice('back')

  useEffect(() => {
    if (!hasPermission) requestPermission()
  }, [hasPermission])

  const codeScanner = useCodeScanner({
    codeTypes: ACCEPTED_CODE_TYPES,
    onCodeScanned: (codes) => {
      if (!isActive || codes.length === 0) return

      const code = codes[0]
      const value = code.value
      if (!value) return

      const now = Date.now()
      if (value === lastScannedValue && now - lastScannedAt < 2000) return

      lastScannedValue = value
      lastScannedAt    = now

      onScan(value)
    },
  })

  if (!hasPermission || !device) return null

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={isActive}
      codeScanner={codeScanner}
      torch={torch ? 'on' : 'off'}
    />
  )
}

export function parseQRPayload(raw: string): { type: 'product'; serverId: string } | { type: 'unknown'; raw: string } {
  if (raw.startsWith(QR_PREFIX)) {
    const serverId = raw.slice(QR_PREFIX.length).trim()
    if (serverId.length > 0) return { type: 'product', serverId }
  }
  return { type: 'unknown', raw }
}

export function buildQRPayload(serverProductId: string): string {
  return `${QR_PREFIX}${serverProductId}`
}
