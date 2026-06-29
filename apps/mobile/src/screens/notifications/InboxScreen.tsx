import { useState, useEffect, useCallback } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'

interface InboxItem {
  id: string
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

export default function InboxScreen() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=50')
      const data = await res.json()
      setItems(data.notifications || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setItems(prev => prev.map(i => i.id === id ? { ...i, readAt: new Date().toISOString() } : i))
  }, [])

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>

  return (
    <FlatList
      data={items}
      keyExtractor={i => i.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      renderItem={({ item }) => (
        <Pressable onPress={() => markRead(item.id)} style={[styles.card, !item.readAt && styles.unread]}>
          <Text style={[styles.title, !item.readAt && styles.bold]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  card: { padding: 14, marginBottom: 8, borderRadius: 8, backgroundColor: '#f9fafb' },
  unread: { backgroundColor: '#eff6ff' },
  title: { fontSize: 15, fontWeight: '400' },
  bold: { fontWeight: '600' },
  body: { fontSize: 13, color: '#6b7280', marginTop: 2 },
})
