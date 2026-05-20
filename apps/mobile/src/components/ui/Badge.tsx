import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  label:     string
  variant?:  BadgeVariant
  color?:    string
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surfaceAlt, text: colors.textSecondary },
  success: { bg: colors.greenLight, text: colors.greenDark },
  warning: { bg: colors.yellowLight, text: colors.yellowDark },
  danger:  { bg: colors.errorLight,  text: colors.redDark },
  info:    { bg: colors.blueLight,   text: colors.blueDark },
}

export function Badge({ label, variant = 'default', color }: BadgeProps) {
  const vc = variantColors[variant]
  return (
    <View style={[styles.badge, { backgroundColor: color ?? vc.bg }]}>
      <Text style={[styles.label, { color: vc.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   3,
    borderRadius:      radius.full,
    alignSelf:         'flex-start',
  },
  label: {
    fontSize:   11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})
