import type { EarningsSummary } from '@chordially/shared'

interface Props {
  summary: EarningsSummary
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 16, padding: 20,
  border: '1px solid #e5e7eb', marginBottom: 16,
}

export default function EarningsSummaryCard({ summary }: Props) {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Earnings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Stat label="Total earned" value={`${summary.totalEarned} ${summary.currency}`} highlight />
        <Stat label="Pending" value={`${summary.pendingAmount} ${summary.currency}`} />
        <Stat label="Paid out" value={`${summary.paidOut} ${summary.currency}`} />
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, marginBottom: 0 }}>
        {new Date(summary.periodStart).toLocaleDateString()} – {new Date(summary.periodEnd).toLocaleDateString()}
      </p>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: highlight ? '#16a34a' : '#111827', margin: 0 }}>{value}</p>
    </div>
  )
}
