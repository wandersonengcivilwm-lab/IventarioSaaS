import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../../theme/colors'
import { spacing, radius, shadow } from '../../theme/spacing'

interface CardProps {
  children:  React.ReactNode
  style?:    ViewStyle
  elevated?: boolean
  padded?:   boolean
}

export function Card({ children, style, elevated = false, padded = true }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && shadow.md,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  padded: {
    padding: spacing.lg,
  },
})
