import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

interface InputProps extends TextInputProps {
  label?:       string
  error?:       string
  hint?:        string
  containerStyle?: ViewStyle
}

export function Input({ label, error, hint, containerStyle, ...rest }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : styles.inputDefault,
        ]}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize:   13,
    fontWeight: '500',
    color:      colors.textSecondary,
  },
  input: {
    height:            48,
    paddingHorizontal: spacing.lg,
    borderWidth:       1,
    borderRadius:      radius.md,
    fontSize:          15,
    color:             colors.textPrimary,
    backgroundColor:   colors.surface,
  },
  inputDefault: {
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: 12,
    color:    colors.error,
  },
  hint: {
    fontSize: 12,
    color:    colors.textMuted,
  },
})
