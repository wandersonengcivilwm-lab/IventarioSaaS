import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useNotifications, type NotificationItem } from '../../hooks/useNotifications'
import { EmptyState } from '../../components/ui/EmptyState'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'

const TYPE_ICONS: Record<string, string> = {
  low_stock:   '⚠️',
  transaction: '🔄',
  kanban_move: '📋',
  mention:     '💬',
  system:      '📢',
}

const TYPE_COLORS: Record<string, string> = {
  low_stock:   colors.errorLight,
  transaction: colors.greenLight,
  kanban_move: colors.blueLight,
  mention:     colors.yellowLight,
  system:      colors.surfaceAlt,
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()

  function formatRelative(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime()
    const min  = Math.floor(diff / 60000)
    const hr   = Math.floor(diff / 3600000)
    const day  = Math.floor(diff / 86400000)
    if (min < 1)   return 'agora'
    if (min < 60)  return `${min} min atrás`
    if (hr < 24)   return `${hr}h atrás`
    if (day < 7)   return `${day}d atrás`
    return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  function handleNotifPress(notif: NotificationItem) {
    markAsRead(notif.id)

    // Deep link manual
    const productId = notif.data?.product_id as string | undefined
    if (notif.type === 'low_stock' && productId) {
      router.push(`/(app)/products/${productId}` as any)
      return
    }
    if (notif.type === 'kanban_move') {
      router.push('/(app)/kanban')
      return
    }
    if (notif.type === 'transaction') {
      router.push('/(app)/transactions/index' as any)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notificações</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Ler todas</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blueDark} />
      ) : notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="Tudo em dia!"
          description="Você receberá alertas de estoque baixo, movimentações e atualizações do Kanban aqui."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          contentContainerStyle={{ paddingVertical: spacing.sm, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isUnread = !item.read_at
            const bgColor  = TYPE_COLORS[item.type] ?? colors.surfaceAlt
            return (
              <TouchableOpacity
                onPress={() => handleNotifPress(item)}
                style={[styles.notifItem, isUnread && styles.notifUnread]}
              >
                {/* Ícone */}
                <View style={[styles.notifIcon, { backgroundColor: bgColor }]}>
                  <Text style={styles.notifIconText}>
                    {TYPE_ICONS[item.type] ?? '📣'}
                  </Text>
                </View>

                {/* Conteúdo */}
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={styles.notifTime}>
                    {formatRelative(item.created_at)}
                  </Text>
                </View>

                {/* Indicador de não lido */}
                {isUnread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            )
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  back:             { fontSize: 16, color: colors.blueDark, fontWeight: '500', width: 64 },
  title:            { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  markAll:          { fontSize: 13, color: colors.blueDark, fontWeight: '600', width: 64, textAlign: 'right' },
  notifItem:        { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  notifUnread:      { backgroundColor: colors.blueLight + '22' },
  notifIcon:        { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifIconText:    { fontSize: 20 },
  notifContent:     { flex: 1, gap: 3 },
  notifTitle:       { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  notifTitleUnread: { fontWeight: '700' },
  notifBody:        { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  notifTime:        { fontSize: 11, color: colors.textMuted },
  unreadDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blueDark, marginTop: 6 },
  separator:        { height: 1, backgroundColor: colors.border },
})
