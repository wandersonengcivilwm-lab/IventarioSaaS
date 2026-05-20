import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../store/authStore'
import { can } from '@inventory-saas/shared'
import { colors } from '../../../theme/colors'
import { spacing, radius } from '../../../theme/spacing'
import type { UserRole } from '@inventory-saas/shared'

const ROLE_LABELS: Record<UserRole, string> = {
  owner:    'Proprietário',
  admin:    'Administrador',
  operator: 'Operador',
  viewer:   'Visualizador',
}

export default function SettingsScreen() {
  const profile = useAuthStore(s => s.profile)
  const role    = profile?.role as UserRole | undefined

  const menuItems = [
    {
      icon:    '👥',
      label:   'Equipe',
      sub:     'Gerenciar membros e permissões',
      onPress: () => router.push('/(app)/settings/team'),
      show:    role ? can(role, 'manage_team') : false,
    },
    {
      icon:    '🏭',
      label:   'Depósitos',
      sub:     'Configurar locais de estoque',
      onPress: () => {},
      show:    role ? can(role, 'manage_settings') : false,
    },
    {
      icon:    '🏷️',
      label:   'Categorias',
      sub:     'Gerenciar categorias de produtos',
      onPress: () => {},
      show:    role ? can(role, 'edit_product') : false,
    },
  ].filter(item => item.show)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Configurações</Text>

        {/* Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name}</Text>
            <Text style={styles.profileRole}>
              {role ? ROLE_LABELS[role] : '—'}
            </Text>
          </View>
        </View>

        {/* Menu */}
        {menuItems.length > 0 && (
          <View style={styles.menuSection}>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  inner:        { padding: spacing.xl, gap: spacing.xl },
  title:        { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  avatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 20, fontWeight: '700', color: colors.blueDark },
  profileInfo:  { flex: 1 },
  profileName:  { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  profileRole:  { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  menuSection:  { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon:     { fontSize: 20, width: 28 },
  menuText:     { flex: 1 },
  menuLabel:    { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  menuSub:      { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  menuChevron:  { fontSize: 20, color: colors.textMuted },
  signOutBtn:   { backgroundColor: colors.errorLight, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center' },
  signOutText:  { fontSize: 15, fontWeight: '600', color: colors.redDark },
})
