interface Props {
  amount: number
  currency: string
  fee: number
  recipientName: string
  status: string
  txHash: string | null
  onClose: () => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
}

const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 400, maxWidth: '90vw',
}

export default function ConfirmationModal({ amount, currency, fee, recipientName, status, txHash, onClose }: Props) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Transaction details</h3>
        <div style={{ marginBottom: 12 }}>
          <Row label="Recipient" value={recipientName} />
          <Row label="Amount" value={`${amount} ${currency}`} />
          <Row label="Fee" value={`${fee} ${currency}`} />
          <Row label="Status" value={status} />
          {txHash && <Row label="Tx hash" value={txHash} />}
        </div>
        <button onClick={onClose} style={{
          width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none',
          padding: 12, borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600,
        }}>
          Close
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: txHashStyle(label) ? 'monospace' : undefined }}>{value}</span>
    </div>
  )
}

function txHashStyle(label: string): boolean {
  return label === 'Tx hash'
}
