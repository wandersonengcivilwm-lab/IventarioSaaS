import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'
import { Button } from './Button'

interface EmptyStateProps {
  emoji:       string
  title:       string
  description?: string
  action?:     { label: string; onPress: () => void }
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && (
        <Button label={action.label} onPress={action.onPress} style={styles.button} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing['3xl'],
    gap:             spacing.md,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize:   18,
    fontWeight: '600',
    color:      colors.textPrimary,
    textAlign:  'center',
  },
  description: {
    fontSize:  14,
    color:     colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
})
