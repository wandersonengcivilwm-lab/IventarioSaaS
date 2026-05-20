import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '../../services/supabase'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

export default function RegisterScreen() {
  const [fullName, setFullName]       = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [loading, setLoading]         = useState(false)

  async function handleRegister() {
    if (!fullName || !companyName || !email || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'Senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName, company_name: companyName },
      },
    })
    setLoading(false)

    if (error) {
      Alert.alert('Erro ao criar conta', error.message)
    } else {
      Alert.alert(
        'Conta criada!',
        'Verifique seu e-mail para confirmar o cadastro (se necessário).',
      )
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Comece grátis — sem cartão de crédito</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Seu nome', value: fullName,      setter: setFullName,      placeholder: 'João Silva',          type: 'default' },
            { label: 'Empresa',  value: companyName,   setter: setCompanyName,   placeholder: 'Minha Empresa Ltda',  type: 'default' },
            { label: 'E-mail',   value: email,         setter: setEmail,         placeholder: 'joao@empresa.com',    type: 'email-address' },
          ].map(field => (
            <View key={field.label} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.type as any}
                autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
              />
            </View>
          ))}

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Criar conta grátis</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.link}>
              <Text style={styles.linkText}>
                Já tem conta? <Text style={styles.linkBold}>Entrar</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing['3xl'], paddingVertical: spacing['4xl'] },
  header: { marginBottom: spacing['3xl'] },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  input: {
    height: 48, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.lg,
    fontSize: 15, color: colors.textPrimary,
  },
  button: {
    height: 50, backgroundColor: colors.blueDark,
    borderRadius: radius.md, alignItems: 'center',
    justifyContent: 'center', marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '600', color: colors.textInverse },
  link: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { fontSize: 14, color: colors.textSecondary },
  linkBold: { fontWeight: '600', color: colors.blueDark },
})
