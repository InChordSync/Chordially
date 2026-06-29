import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import WalletLinkScreen from '../screens/WalletLinkScreen'
import type { WalletConnection } from '../types/wallet'

interface Props {
  userId: string
  onComplete: () => void
  onSkip: () => void
}

type StepState = 'info' | 'linking' | 'complete'

export default function OnboardingWalletStep({ userId, onComplete, onSkip }: Props) {
  const [stepState, setStepState] = useState<StepState>('info')
  const [connection, setConnection] = useState<WalletConnection | null>(null)

  if (stepState === 'linking') {
    return (
      <WalletLinkScreen
        userId={userId}
        onLinked={(conn) => {
          setConnection(conn)
          setStepState('complete')
        }}
      />
    )
  }

  if (stepState === 'complete' && connection) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.title}>Wallet verified</Text>
        <Text style={styles.detail}>{connection.publicKey}</Text>
        <Pressable style={styles.button} onPress={onComplete}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Link your wallet (optional)</Text>
      <Text style={styles.description}>
        Connect a Stellar wallet to receive payments, tips, and rewards directly.
        You can skip this step and link a wallet later in your profile settings.
      </Text>

      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>Why link a wallet?</Text>
        <Text style={styles.benefitItem}>• Receive tips and payments from fans</Text>
        <Text style={styles.benefitItem}>• Claim campaign rewards</Text>
        <Text style={styles.benefitItem}>• Withdraw earnings directly</Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => setStepState('linking')}
      >
        <Text style={styles.buttonText}>Link wallet</Text>
      </Pressable>

      <Pressable style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 8, color: '#16a34a' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  description: { fontSize: 14, color: '#4b5563', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  detail: { fontSize: 12, color: '#4b5563', textAlign: 'center', fontFamily: 'monospace', marginBottom: 24 },
  benefitsCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  benefitsTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  benefitItem: { fontSize: 14, color: '#374151', marginBottom: 4, lineHeight: 20 },
  button: {
    backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 999,
    alignItems: 'center', marginBottom: 12,
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  skipButton: { paddingVertical: 10, alignItems: 'center' },
  skipButtonText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
})
