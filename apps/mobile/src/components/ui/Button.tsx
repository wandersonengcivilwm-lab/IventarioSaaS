import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label:      string
  onPress:    () => void
  variant?:   Variant
  size?:      Size
  loading?:   boolean
  disabled?:  boolean
  fullWidth?: boolean
  style?:     ViewStyle
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: colors.blueDark,   text: colors.textInverse },
  secondary: { bg: colors.surfaceAlt, text: colors.textPrimary, border: colors.border },
  danger:    { bg: colors.redDark,    text: colors.textInverse },
  ghost:     { bg: 'transparent',     text: colors.blueDark },
}

const sizeStyles: Record<Size, { height: number; px: number; fontSize: number }> = {
  sm: { height: 36, px: spacing.lg,  fontSize: 13 },
  md: { height: 46, px: spacing.xl,  fontSize: 15 },
  lg: { height: 52, px: spacing['2xl'], fontSize: 16 },
}

export function Button({
  label,
  onPress,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const v = variantStyles[variant]
  const s = sizeStyles[size]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          height:            s.height,
          paddingHorizontal: s.px,
          backgroundColor:   v.bg,
          borderWidth:       v.border ? 1 : 0,
          borderColor:       v.border ?? 'transparent',
          width:             fullWidth ? '100%' : undefined,
          opacity:           disabled || loading ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.label, { fontSize: s.fontSize, color: v.text }]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius:    radius.md,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
  },
  label: {
    fontWeight: '600',
  },
})
