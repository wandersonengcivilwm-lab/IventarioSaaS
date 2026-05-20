import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'

function TabIcon({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Início" emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Escanear" emoji="📷" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Movim." emoji="🔄" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="kanban/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Kanban" emoji="📋" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Análise" emoji="📊" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Config" emoji="⚙️" focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 4,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.4,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.blueDark,
    fontWeight: '600',
  },
})
