import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, Modal,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../store/authStore'
import { can } from '@inventory-saas/shared'
import { colors } from '../../../theme/colors'
import { spacing, radius } from '../../../theme/spacing'
import type { UserRole } from '@inventory-saas/shared'

interface TeamMember {
  id:          string
  full_name:   string
  role:        UserRole
  is_active:   boolean
  last_seen_at: string | null
}

const ROLE_COLORS: Record<UserRole, string> = {
  owner:    '#E8E4F8',
  admin:    '#D4E8F5',
  operator: '#D4F0DA',
  viewer:   '#F3F4F6',
}
const ROLE_TEXT: Record<UserRole, string> = {
  owner:    '#6B46C1',
  admin:    '#1D4ED8',
  operator: '#166534',
  viewer:   '#6B7280',
}
const ROLE_LABELS: Record<UserRole, string> = {
  owner:    'Owner',
  admin:    'Admin',
  operator: 'Operador',
  viewer:   'Visualizador',
}

export default function TeamScreen() {
  const profile  = useAuthStore(s => s.profile)
  const tenantId = useAuthStore(s => s.tenantId)
  const role     = profile?.role as UserRole | undefined

  const [members, setMembers]       = useState<TeamMember[]>([])
  const [loading, setLoading]       = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<'admin' | 'operator' | 'viewer'>('operator')
  const [inviteName, setInviteName]   = useState('')
  const [inviting, setInviting]       = useState(false)

  useEffect(() => {
    if (!tenantId) return
    loadMembers()
  }, [tenantId])

  async function loadMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('id, full_name, role, is_active, last_seen_at')
      .eq('tenant_id', tenantId!)
      .order('role')
      .order('full_name')
    setMembers((data ?? []) as TeamMember[])
    setLoading(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) { Alert.alert('Atenção', 'Informe o e-mail.'); return }
    setInviting(true)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/invite-user`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email:     inviteEmail.trim(),
          role:      inviteRole,
          full_name: inviteName.trim() || undefined,
        }),
      },
    )
    const json = await res.json()
    setInviting(false)

    if (!res.ok) {
      Alert.alert('Erro', json.error ?? 'Não foi possível enviar o convite.')
    } else {
      setShowInvite(false)
      setInviteEmail('')
      setInviteName('')
      Alert.alert('Convite enviado!', `Um e-mail foi enviado para ${inviteEmail}.`)
    }
  }

  const canInvite = role && can(role, 'manage_team')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Equipe</Text>
        {canInvite ? (
          <TouchableOpacity onPress={() => setShowInvite(true)}>
            <Text style={styles.inviteBtn}>+ Convidar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blueDark} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingVertical: spacing.md }}
          renderItem={({ item }) => {
            const isMe = item.id === profile?.id
            const rc   = ROLE_COLORS[item.role]
            const rt   = ROLE_TEXT[item.role]
            return (
              <View style={[styles.memberRow, !item.is_active && styles.memberInactive]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {item.full_name}
                    {isMe && <Text style={styles.meBadge}> (você)</Text>}
                  </Text>
                  <Text style={styles.lastSeen}>
                    {item.last_seen_at
                      ? `Visto: ${new Date(item.last_seen_at).toLocaleDateString('pt-BR')}`
                      : 'Nunca acessou'}
                  </Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: rc }]}>
                  <Text style={[styles.roleText, { color: rt }]}>
                    {ROLE_LABELS[item.role]}
                  </Text>
                </View>
              </View>
            )
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Modal de convite */}
      <Modal
        visible={showInvite}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInvite(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInvite(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Convidar membro</Text>
            <View style={{ width: 64 }} />
          </View>

          <View style={styles.modalForm}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <TextInput
                style={styles.input}
                value={inviteName}
                onChangeText={setInviteName}
                placeholder="Ana Silva"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-mail *</Text>
              <TextInput
                style={styles.input}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="ana@empresa.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Permissão</Text>
              <View style={styles.roleGrid}>
                {(['admin', 'operator', 'viewer'] as const).map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setInviteRole(r)}
                    style={[
                      styles.roleBtn,
                      inviteRole === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_TEXT[r] },
                    ]}
                  >
                    <Text style={[
                      styles.roleBtnText,
                      inviteRole === r && { color: ROLE_TEXT[r], fontWeight: '700' },
                    ]}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, inviting && styles.sendBtnDisabled]}
              onPress={handleInvite}
              disabled={inviting}
            >
              <Text style={styles.sendBtnText}>
                {inviting ? 'Enviando...' : 'Enviar convite por e-mail'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  back:            { fontSize: 16, color: colors.blueDark, fontWeight: '500', width: 64 },
  title:           { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  inviteBtn:       { fontSize: 14, color: colors.blueDark, fontWeight: '600', width: 64, textAlign: 'right' },
  memberRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  memberInactive:  { opacity: 0.5 },
  avatar:          { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { fontSize: 16, fontWeight: '700', color: colors.blueDark },
  memberInfo:      { flex: 1 },
  memberName:      { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  meBadge:         { fontSize: 12, color: colors.textMuted, fontWeight: '400' },
  lastSeen:        { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  roleBadge:       { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  roleText:        { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  separator:       { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.xl },
  modalContainer:  { flex: 1, backgroundColor: colors.background },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalCancel:     { fontSize: 16, color: colors.textSecondary, width: 64 },
  modalTitle:      { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  modalForm:       { padding: spacing.xl, gap: spacing.xl },
  field:           { gap: spacing.xs },
  fieldLabel:      { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  input:           { height: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, fontSize: 15, color: colors.textPrimary },
  roleGrid:        { flexDirection: 'row', gap: spacing.sm },
  roleBtn:         { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  roleBtnText:     { fontSize: 13, color: colors.textSecondary },
  sendBtn:         { height: 50, backgroundColor: colors.blueDark, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText:     { fontSize: 15, fontWeight: '600', color: colors.textInverse },
})
