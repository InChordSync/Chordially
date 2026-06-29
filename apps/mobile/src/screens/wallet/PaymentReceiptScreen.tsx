import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { PaymentReceipt } from '@chordially/shared'
import { apiFetch } from '../../services/api-client'

interface Props {
  receiptId: string
  token: string
  onClose: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ok'; receipt: PaymentReceipt }
  | { status: 'error'; message: string }

export default function PaymentReceiptScreen({ receiptId, token, onClose }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const data = await apiFetch<{ receipt: PaymentReceipt }>(`/api/payments/receipts/${receiptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setState({ status: 'ok', receipt: data.receipt })
    } catch {
      setState({ status: 'error', message: 'Failed to load receipt' })
    }
  }, [receiptId, token])

  useEffect(() => { load() }, [load])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Payment receipt</Text>
      {state.status === 'loading' && <ActivityIndicator />}
      {state.status === 'error' && <Text style={styles.errorText}>{state.message}</Text>}
      {state.status === 'ok' && (
        <View style={styles.card}>
          <Row label="Amount" value={`${state.receipt.amount} ${state.receipt.currency}`} />
          <Row label="Status" value={state.receipt.status} />
          <Row label="Network" value={state.receipt.network} />
          {state.receipt.txHash && <Row label="Tx hash" value={state.receipt.txHash} />}
          {state.receipt.memo && <Row label="Memo" value={state.receipt.memo} />}
          <Row label="Created" value={new Date(state.receipt.createdAt).toLocaleString()} />
          {state.receipt.confirmedAt && <Row label="Confirmed" value={new Date(state.receipt.confirmedAt).toLocaleString()} />}
        </View>
      )}
      <Pressable style={styles.button} onPress={onClose}><Text style={styles.buttonText}>Close</Text></Pressable>
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel: { fontSize: 13, color: '#6b7280' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  button: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#dc2626' },
})
