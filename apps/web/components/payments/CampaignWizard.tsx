import { useState } from 'react'

interface Props {
  onCreated: (campaignId: string) => void
  onCancel: () => void
}

export default function CampaignWizard({ onCreated, onCancel }: Props) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [currency, setCurrency] = useState('XLM')
  const [deadline, setDeadline] = useState('')

  const handleSubmit = async () => {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, goal: Number(goal), currency, deadline }),
    })
    if (res.ok) {
      const data = await res.json()
      onCreated(data.campaign?.id)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Create campaign</h2>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Step {step} of 3</p>

      {step === 1 && (
        <div>
          <label style={labelStyle}>Campaign title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Support my next EP" />
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} placeholder="Tell your supporters what this is for" />
        </div>
      )}

      {step === 2 && (
        <div>
          <label style={labelStyle}>Funding goal</label>
          <input type="number" value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle} placeholder="1000" />
          <label style={labelStyle}>Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={inputStyle}>
            <option value="XLM">XLM</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
      )}

      {step === 3 && (
        <div>
          <label style={labelStyle}>Deadline</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        {step > 1 && <button onClick={() => setStep(s => s - 1)} style={secondaryBtnStyle}>Back</button>}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} style={primaryBtnStyle}>Next</button>
        ) : (
          <button onClick={handleSubmit} style={primaryBtnStyle}>Create campaign</button>
        )}
        <button onClick={onCancel} style={secondaryBtnStyle}>Cancel</button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db',
  marginBottom: 12, fontSize: 14, boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4,
}

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px',
  borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
}

const secondaryBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #d1d5db', color: '#374151',
  padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
}
