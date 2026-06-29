interface Props {
  publicKey: string
  onContinue: () => void
}

export default function VerificationSuccess({ publicKey, onContinue }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      <p style={{ fontSize: 48, margin: '0 0 12px' }}>✓</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#16a34a' }}>Wallet verified</h2>
      <p style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace', margin: '0 0 4px' }}>{publicKey}</p>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px' }}>
        Your Stellar wallet is now linked to your account. You can send and receive payments.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 240, margin: '0 auto' }}>
        <button onClick={onContinue} style={{
          backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: 12,
          borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600,
        }}>
          Continue to dashboard
        </button>
      </div>
    </div>
  )
}
