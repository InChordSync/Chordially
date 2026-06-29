import { useState } from 'react'
import WalletChallengeForm from './WalletChallengeForm'
import VerificationSuccess from './VerificationSuccess'

interface Props {
  onComplete: () => void
  onSkip: () => void
}

const panelStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, padding: 24, maxWidth: 480, margin: '0 auto',
  border: '1px solid #e5e7eb',
}

export default function WalletOnboardingPanel({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<'intro' | 'challenge' | 'success'>('intro')
  const [publicKey, setPublicKey] = useState('')

  if (step === 'challenge') {
    return (
      <div style={panelStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Link your wallet</h3>
        <WalletChallengeForm onSuccess={() => setStep('success')} />
      </div>
    )
  }

  if (step === 'success') {
    return <VerificationSuccess publicKey={publicKey} onContinue={onComplete} />
  }

  return (
    <div style={panelStyle}>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Link your Stellar wallet</h3>
      <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 20 }}>
        Connect a wallet to receive tips, rewards, and payments. This is optional and can be done later.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => setStep('challenge')} style={{
          backgroundColor: '#2563eb', color: '#fff', border: 'none',
          padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>
          Link wallet
        </button>
        <button onClick={onSkip} style={{
          background: 'none', border: '1px solid #d1d5db', color: '#374151',
          padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
        }}>
          Skip
        </button>
      </div>
    </div>
  )
}
