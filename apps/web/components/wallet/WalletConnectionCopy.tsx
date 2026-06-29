interface WalletConnectionCopyProps {
  onConnect: () => void
  onDisconnect: () => void
  isConnected: boolean
  connectedPublicKey?: string
}

export default function WalletConnectionCopy({ onConnect, onDisconnect, isConnected, connectedPublicKey }: WalletConnectionCopyProps) {
  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Wallet Connection</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
        Connect your Stellar wallet to enable tipping, earnings, and creator support.
        Your wallet is used to sign transactions and verify your identity on-chain.
      </p>

      {isConnected ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Wallet Connected</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, wordBreak: 'break-all' }}>{connectedPublicKey}</p>
          <button onClick={onDisconnect} style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
            Disconnect Wallet
          </button>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
            Disconnecting will require re-verification to use tipping features again.
          </p>
        </div>
      ) : (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
            No wallet connected. Connect your Stellar wallet to start supporting creators.
          </p>
          <button onClick={onConnect} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            Connect Wallet
          </button>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Account Recovery</h3>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
          If you lose access to your wallet, you can recover your account using your backup phrase
          or by contacting support with your verified email address.
        </p>
        <button style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
          Learn About Recovery
        </button>
      </div>
    </div>
  )
}
