import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

const AMOUNT_PRESETS = [5, 10, 25, 50, 100]

interface Props {
  recipientId: string
  recipientName: string
  onSent: () => void
  onCancel: () => void
}

export default function TipComposerScreen({ recipientId, recipientName, onSent, onCancel }: Props) {
  const [amount, setAmount] = useState(10)
  const [customAmount, setCustomAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePreset = (value: number) => {
    setAmount(value)
    setCustomAmount('')
  }

  const handleSend = async () => {
    if (amount <= 0) { Alert.alert('Invalid', 'Enter an amount greater than 0.'); return }
    setSending(true)
    try {
      await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, amount, currency: 'XLM', memo: memo || undefined }),
      })
      setSuccess(true)
      onSent()
    } catch {
      Alert.alert('Error', 'Failed to send tip.')
    } finally {
      setSending(false)
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Tip sent!</Text>
        <Text style={styles.successDetail}>{amount} XLM to {recipientName}</Text>
        <Pressable style={styles.button} onPress={onSent}><Text style={styles.buttonText}>Done</Text></Pressable>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Send a tip</Text>
      <Text style={styles.description}>Support {recipientName} with a contribution.</Text>

      <Text style={styles.label}>Amount</Text>
      <View style={styles.presets}>
        {AMOUNT_PRESETS.map(p => (
          <Pressable
            key={p}
            onPress={() => handlePreset(p)}
            style={[styles.presetBtn, amount === p && styles.presetActive]}
          >
            <Text style={[styles.presetText, amount === p && styles.presetTextActive]}>{p} XLM</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={customAmount}
        onChangeText={v => { setCustomAmount(v); setAmount(Number(v) || 0) }}
        placeholder="Custom amount"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Memo (optional)</Text>
      <TextInput
        style={styles.input}
        value={memo}
        onChangeText={setMemo}
        placeholder="Add a message..."
      />

      <Pressable
        style={[styles.sendButton, amount <= 0 && styles.sendDisabled]}
        onPress={handleSend}
        disabled={sending || amount <= 0}
      >
        {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send {amount} XLM</Text>}
      </Pressable>

      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  description: { fontSize: 14, color: '#4b5563', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff',
  },
  presetActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  presetText: { fontSize: 14, color: '#374151' },
  presetTextActive: { color: '#2563eb', fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 999,
    alignItems: 'center', marginTop: 24,
  },
  sendDisabled: { backgroundColor: '#9ca3af' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#6b7280', fontWeight: '600' },
  successIcon: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  successTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#16a34a', marginBottom: 4 },
  successDetail: { fontSize: 14, textAlign: 'center', color: '#4b5563', marginBottom: 24 },
  button: {
    backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 999, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
