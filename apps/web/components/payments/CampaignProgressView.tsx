import type { CampaignMetadata } from '@chordially/shared'

interface Props {
  campaign: CampaignMetadata
}

export default function CampaignProgressView({ campaign }: Props) {
  const progressPct = Math.min(100, Math.round((campaign.progress / campaign.goal) * 100))

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 16, padding: 20,
      border: '1px solid #e5e7eb', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>{campaign.title}</h3>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{campaign.description}</p>
        </div>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 999,
          backgroundColor: campaign.status === 'active' ? '#dcfce7' : '#f3f4f6',
          color: campaign.status === 'active' ? '#16a34a' : '#6b7280',
        }}>
          {campaign.status}
        </span>
      </div>

      <div style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }}>
        <div style={{ height: 8, backgroundColor: '#2563eb', borderRadius: 4, width: `${progressPct}%` }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{campaign.progress} {campaign.currency}</span>
        <span style={{ fontSize: 13, color: '#6b7280' }}>of {campaign.goal} {campaign.currency}</span>
      </div>

      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
        Deadline: {new Date(campaign.deadline).toLocaleDateString()}
      </p>
    </div>
  )
}
