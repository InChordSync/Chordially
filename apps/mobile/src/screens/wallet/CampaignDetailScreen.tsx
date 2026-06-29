import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CampaignMetadata } from '@chordially/shared'
import { apiFetch } from '../../services/api-client'

interface Props {
  campaignId: string
  token: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ok'; campaign: CampaignMetadata }
  | { status: 'error'; message: string }

export default function CampaignDetailScreen({ campaignId, token }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ campaign: CampaignMetadata }>(`/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setState({ status: 'ok', campaign: data.campaign })
    } catch {
      setState({ status: 'error', message: 'Failed to load campaign' })
    }
  }, [campaignId, token])

  useEffect(() => { load() }, [load])

  if (state.status === 'loading') return <View style={styles.center}><ActivityIndicator size="large" /></View>
  if (state.status === 'error') return <View style={styles.center}><Text style={{ color: '#dc2626' }}>{state.message}</Text></View>

  const { campaign } = state
  const progressPct = Math.min(100, Math.round((campaign.progress / campaign.goal) * 100))

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{campaign.title}</Text>
      <Text style={styles.description}>{campaign.description}</Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statValue}>{campaign.progress} {campaign.currency}</Text>
        <Text style={styles.statLabel}>of {campaign.goal} {campaign.currency}</Text>
      </View>

      <Text style={styles.deadline}>Deadline: {new Date(campaign.deadline).toLocaleDateString()}</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{campaign.status}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 14, color: '#4b5563', marginBottom: 20, lineHeight: 20 },
  progressBar: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, marginBottom: 8 },
  progressFill: { height: 12, backgroundColor: '#2563eb', borderRadius: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 14, color: '#6b7280', lineHeight: 24 },
  deadline: { fontSize: 13, color: '#9ca3af', marginBottom: 16 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
})
