import type { WalletLinkStatusResponse } from '@chordially/shared'

interface Props {
  walletState: WalletLinkStatusResponse
  onLink: () => void
  onUnlink: () => void
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, padding: 20,
  border: '1px solid #e5e7eb', marginBottom: 16,
}

export default function WalletStatusCard({ walletState, onLink, onUnlink }: Props) {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Wallet</h3>
      {walletState.linked && walletState.wallet ? (
        <>
          <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, margin: '0 0 4px' }}>✓ Verified</p>
          <p style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace', margin: '0 0 12px' }}>
            {walletState.wallet.publicKey}
          </p>
          <button onClick={onUnlink} style={{
            background: 'none', border: '1px solid #dc2626', color: '#dc2626',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}>
            Unlink
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
            No wallet linked. Connect a Stellar wallet to receive payments.
          </p>
          <button onClick={onLink} style={{
            backgroundColor: '#2563eb', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>
            Link wallet
          </button>
        </>
      )}
    </div>
  )
}
