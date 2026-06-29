import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { LinkState, WalletConnection } from '../types/wallet'
import { requestWalletLink, verifyWalletSignature } from '../services/wallet-service'

interface Props {
  userId: string
  onLinked: (connection: WalletConnection) => void
}

export default function WalletLinkScreen({ userId, onLinked }: Props) {
  const [state, setState] = useState<LinkState>({ status: 'idle' })
  const [publicKeyInput, setPublicKeyInput] = useState('')
  const [signatureInput, setSignatureInput] = useState('')

  const handleStartLink = useCallback(async () => {
    if (!publicKeyInput.trim()) {
      Alert.alert('Required', 'Enter your Stellar public key to continue.')
      return
    }
    setState({ status: 'linking' })
    try {
      const { challenge } = await requestWalletLink(userId)
      setState({ status: 'awaiting_verification', publicKey: publicKeyInput.trim() })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start wallet link'
      setState({ status: 'error', message: msg })
    }
  }, [userId, publicKeyInput])

  const handleVerify = useCallback(async () => {
    if (!signatureInput.trim()) {
      Alert.alert('Required', 'Sign the challenge with your wallet and paste the signature.')
      return
    }
    setState((current) =>
      current.status === 'awaiting_verification'
        ? { ...current, status: 'linking' }
        : current,
    )
    try {
      const connection = await verifyWalletSignature(
        '',
        signatureInput.trim(),
        (state as { status: 'awaiting_verification'; publicKey: string }).publicKey,
      )
      setState({ status: 'verified', connection })
      onLinked(connection)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      setState({ status: 'error', message: msg })
    }
  }, [signatureInput, state, onLinked])

  if (state.status === 'verified') {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Wallet linked</Text>
        <Text style={styles.successDetail}>{state.connection.publicKey}</Text>
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
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Link your Stellar wallet</Text>
      <Text style={styles.description}>
        Connect your Stellar wallet to receive payments and rewards.
      </Text>

      {state.status === 'awaiting_verification' ? (
        <>
          <Text style={styles.label}>Signature</Text>
          <Text style={styles.hint}>
            Sign the verification challenge with your wallet's private key and paste
            the resulting signature below.
          </Text>
          <TextInput
            style={styles.input}
            value={signatureInput}
            onChangeText={setSignatureInput}
            placeholder="Paste your signature"
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
          <Pressable style={styles.button} onPress={handleVerify}>
            {state.status === 'linking' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Stellar public key</Text>
          <TextInput
            style={styles.input}
            value={publicKeyInput}
            onChangeText={setPublicKeyInput}
            placeholder="G..."
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.button} onPress={handleStartLink}>
            {state.status === 'linking' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Link wallet</Text>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  description: { fontSize: 14, color: '#4b5563', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 6 },
  hint: { fontSize: 12, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
    color: '#111827', backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 999,
    marginTop: 18, alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  successIcon: { fontSize: 48, textAlign: 'center', marginBottom: 8, color: '#16a34a' },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4 },
  successDetail: { fontSize: 12, color: '#4b5563', textAlign: 'center', fontFamily: 'monospace' },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#dc2626', textAlign: 'center', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 16 },
})
