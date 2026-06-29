import { useState } from 'react'

interface Props {
  recipientId: string
  recipientName: string
  onTipSent: () => void
}

const AMOUNT_PRESETS = [5, 10, 25, 50, 100]

export default function TipPanel({ recipientId, recipientName, onTipSent }: Props) {
  const [amount, setAmount] = useState(10)
  const [customAmount, setCustomAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePreset = (value: number) => {
    setAmount(value)
    setCustomAmount('')
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, amount, currency: 'XLM' }),
      })
      setSuccess(true)
      onTipSent()
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ fontSize: 40, margin: '0 0 8px' }}>🎉</p>
        <p style={{ fontWeight: 600 }}>Tip sent to {recipientName}!</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Send a tip</h3>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
        Support {recipientName} with a contribution.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {AMOUNT_PRESETS.map(p => (
          <button key={p} onClick={() => handlePreset(p)} style={{
            padding: '6px 14px', borderRadius: 8, border: amount === p ? '2px solid #2563eb' : '1px solid #d1d5db',
            backgroundColor: amount === p ? '#eff6ff' : '#fff', cursor: 'pointer', fontWeight: amount === p ? 600 : 400,
          }}>
            ${p}
          </button>
        ))}
      </div>
      <input
        type="number"
        placeholder="Custom amount"
        value={customAmount}
        onChange={e => { setCustomAmount(e.target.value); setAmount(Number(e.target.value) || 0) }}
        style={{
          width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db',
          marginBottom: 12, fontSize: 14,
        }}
      />
      <button onClick={handleSend} disabled={sending || amount <= 0} style={{
        width: '100%', backgroundColor: amount > 0 ? '#2563eb' : '#9ca3af', color: '#fff',
        border: 'none', padding: 12, borderRadius: 8, cursor: amount > 0 ? 'pointer' : 'not-allowed',
        fontSize: 15, fontWeight: 600,
      }}>
        {sending ? 'Sending...' : `Send $${amount}`}
      </button>
    </div>
  )
}
