import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { UnlinkState } from '../types/wallet'
import { unlinkWallet } from '../services/wallet-service'

interface Props {
  userId: string
  publicKey: string
  onUnlinked: () => void
  onCancel: () => void
}

export default function WalletUnlinkScreen({ userId, publicKey, onUnlinked, onCancel }: Props) {
  const [state, setState] = useState<UnlinkState>({ status: 'idle' })

  const handleConfirm = useCallback(async () => {
    setState({ status: 'unlinking' })
    try {
      await unlinkWallet(userId)
      setState({ status: 'done' })
      onUnlinked()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unlink wallet'
      setState({ status: 'error', message: msg })
    }
  }, [userId, onUnlinked])

  const handleCancel = useCallback(() => {
    if (state.status === 'confirming') {
      setState({ status: 'idle' })
    } else {
      onCancel()
    }
  }, [state.status, onCancel])

  if (state.status === 'done') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.title}>Wallet unlinked</Text>
        <Text style={styles.detail}>Your Stellar wallet has been disconnected.</Text>
        <Pressable style={styles.button} onPress={onUnlinked}>
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </View>
    )
  }

  if (state.status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{state.message}</Text>
        <Pressable style={styles.button} onPress={() => setState({ status: 'idle' })}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Unlink wallet</Text>

      {state.status === 'confirming' ? (
        <>
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Are you sure?</Text>
            <Text style={styles.warningText}>
              Unlinking your wallet will disconnect{' '}
              <Text style={styles.mono}>{publicKey}</Text> from your account.
              {'\n\n'}
              You can link a new wallet at any time.
            </Text>
          </View>

          <Pressable style={styles.dangerButton} onPress={handleConfirm}>
            {state.status === 'unlinking' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.dangerButtonText}>Yes, unlink wallet</Text>
            )}
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => setState({ status: 'idle' })}>
            <Text style={styles.cancelText}>Keep wallet linked</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.description}>
            This will disconnect your Stellar wallet from your account. You can link a
            new wallet at any time from your settings.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Linked wallet</Text>
            <Text style={styles.mono}>{publicKey}</Text>
          </View>

          <Pressable
            style={styles.dangerButton}
            onPress={() => setState({ status: 'confirming' })}
          >
            <Text style={styles.dangerButtonText}>Unlink wallet</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 8, color: '#16a34a' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6, textAlign: 'center' },
  detail: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 24 },
  description: { fontSize: 14, color: '#4b5563', lineHeight: 20, marginBottom: 20 },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#374151' },
  infoCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  infoLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  warningCard: {
    backgroundColor: '#fef2f2', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#fecaca',
  },
  warningTitle: { fontSize: 16, fontWeight: '700', color: '#dc2626', marginBottom: 8 },
  warningText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  button: {
    backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 999, alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  dangerButton: {
    backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginBottom: 12,
  },
  dangerButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  cancelButton: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#dc2626', textAlign: 'center', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 16 },
})
