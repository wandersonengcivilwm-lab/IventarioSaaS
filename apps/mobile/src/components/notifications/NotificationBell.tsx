import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useNotifications } from '../../hooks/useNotifications'
import { colors } from '../../theme/colors'

export function NotificationBell() {
  const { unreadCount } = useNotifications()

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/notifications' as any)}
      style={styles.container}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.bell}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding:  4,
  },
  bell: {
    fontSize: 22,
  },
  badge: {
    position:        'absolute',
    top:             -2,
    right:           -2,
    backgroundColor: colors.redDark,
    borderRadius:    10,
    minWidth:        18,
    height:          18,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
    borderWidth:     1.5,
    borderColor:     colors.background,
  },
  badgeText: {
    fontSize:   10,
    fontWeight: '800',
    color:      '#fff',
  },
})
