import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

interface RewardTier {
  id: string
  label: string
  threshold: number
  description: string
  unlocked: boolean
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ok'; rewards: RewardTier[] }
  | { status: 'error'; message: string }

export default function MobileRewardsGallery() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    try {
      const data = await fetch('/api/rewards').then(r => r.json())
      setState({ status: 'ok', rewards: data.rewards || [] })
    } catch {
      setState({ status: 'error', message: 'Failed to load rewards' })
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (state.status === 'loading') return <View style={styles.center}><ActivityIndicator /></View>
  if (state.status === 'error') return <View style={styles.center}><Text style={{ color: '#dc2626' }}>{state.message}</Text></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Rewards</Text>
      {state.rewards.length === 0 && <Text style={styles.empty}>No rewards yet. Support creators to unlock rewards!</Text>}
      {state.rewards.map(r => (
        <View key={r.id} style={[styles.card, !r.unlocked && styles.locked]}>
          <View style={styles.row}>
            <Text style={styles.badge}>{r.unlocked ? '🏆' : '🔒'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierLabel}>{r.label}</Text>
              <Text style={styles.tierDesc}>{r.description}</Text>
              <Text style={styles.tierThreshold}>{r.threshold} XLM threshold</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  empty: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  locked: { opacity: 0.6 },
  row: { flexDirection: 'row', gap: 12 },
  badge: { fontSize: 28 },
  tierLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  tierDesc: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  tierThreshold: { fontSize: 12, color: '#9ca3af' },
})
