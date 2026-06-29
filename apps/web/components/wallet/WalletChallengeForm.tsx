import { useState } from 'react'

interface Props {
  onSuccess: (signature: string) => void
}

export default function WalletChallengeForm({ onSuccess }: Props) {
  const [signature, setSignature] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!signature.trim()) return
    setSubmitted(true)
    onSuccess(signature.trim())
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ fontSize: 40, margin: '0 0 8px' }}>✓</p>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#16a34a' }}>Verification submitted</h3>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Your wallet is being verified. This usually takes a few seconds.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 14, color: '#374151', marginBottom: 12 }}>
        Sign the challenge with your Stellar wallet and paste the signature below.
      </p>
      <textarea
        value={signature}
        onChange={e => setSignature(e.target.value)}
        placeholder="Paste your signature..."
        style={{
          width: '100%', minHeight: 80, padding: 10, borderRadius: 8,
          border: '1px solid #d1d5db', fontSize: 12, fontFamily: 'monospace',
          marginBottom: 12, resize: 'vertical',
        }}
      />
      <button onClick={handleSubmit} style={{
        backgroundColor: '#2563eb', color: '#fff', border: 'none',
        padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
      }}>
        Verify
      </button>
    </div>
  )
}
