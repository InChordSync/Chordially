import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { WalletLinkStatusResponse } from '@chordially/shared'
import { apiFetch } from '../../services/api-client'

interface Props {
  userId: string
  token: string
  onLinkPress: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ok'; walletState: WalletLinkStatusResponse }
  | { status: 'error'; message: string }

export default function WalletAccountSection({ userId, token, onLinkPress }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const walletState = await apiFetch<WalletLinkStatusResponse>('/api/wallet/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setState({ status: 'ok', walletState })
    } catch {
      setState({ status: 'error', message: 'Failed to load wallet status' })
    }
  }, [token])

  useEffect(() => { load() }, [load])

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Linked wallet</Text>
      {state.status === 'loading' && <ActivityIndicator size="small" />}
      {state.status === 'error' && <Text style={styles.errorText}>{state.message}</Text>}
      {state.status === 'ok' && (
        state.walletState.linked && state.walletState.wallet ? (
          <View style={styles.card}>
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedDot}>✓</Text>
              <Text style={styles.verifiedLabel}>Verified</Text>
            </View>
            <Text style={styles.publicKey}>{state.walletState.wallet.publicKey}</Text>
          </View>
        ) : (
          <Pressable style={styles.linkButton} onPress={onLinkPress}>
            <Text style={styles.linkButtonText}>Link Stellar wallet</Text>
          </Pressable>
        )
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  verifiedDot: { fontSize: 16, color: '#16a34a', marginRight: 6, fontWeight: '700' },
  verifiedLabel: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  publicKey: { fontSize: 12, color: '#374151', fontFamily: 'monospace' },
  linkButton: {
    backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center',
  },
  linkButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 13 },
})
