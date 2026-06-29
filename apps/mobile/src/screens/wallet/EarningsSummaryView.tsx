import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { EarningsSummary } from '@chordially/shared'
import { apiFetch } from '../../services/api-client'

interface Props {
  userId: string
  token: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ok'; summary: EarningsSummary }
  | { status: 'error'; message: string }

export default function EarningsSummaryView({ userId, token }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const data = await apiFetch<{ summary: EarningsSummary }>('/api/payments/earnings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setState({ status: 'ok', summary: data.summary })
    } catch {
      setState({ status: 'error', message: 'Failed to load earnings' })
    }
  }, [token])

  useEffect(() => { load() }, [load])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Earnings</Text>
      {state.status === 'loading' && <ActivityIndicator />}
      {state.status === 'error' && <Text style={{ color: '#dc2626' }}>{state.message}</Text>}
      {state.status === 'ok' && (
        <>
          <View style={styles.card}>
            <Stat label="Total earned" value={`${state.summary.totalEarned} ${state.summary.currency}`} highlight />
            <Stat label="Pending" value={`${state.summary.pendingAmount} ${state.summary.currency}`} />
            <Stat label="Paid out" value={`${state.summary.paidOut} ${state.summary.currency}`} />
          </View>
          {state.summary.breakdown.map((b, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.breakdownSource}>{b.source}</Text>
              <Text style={styles.breakdownAmount}>{b.amount} {state.summary.currency} ({b.count})</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: '#16a34a' }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  statLabel: { fontSize: 13, color: '#6b7280' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  breakdownSource: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  breakdownAmount: { fontSize: 13, color: '#6b7280' },
})
