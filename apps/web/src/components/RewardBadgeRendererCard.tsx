import React from 'react';
import type { DigitalRewardTier } from '@chordially/shared';

interface RewardBadgeRendererCardProps {
  badges?: DigitalRewardTier[];
}

export function RewardBadgeRendererCard({ badges = [] }: RewardBadgeRendererCardProps) {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
      {badges.length === 0 ? (
        <span style={{ fontSize: '13px', color: '#64748b' }}>No digital reward badges unlocked yet.</span>
      ) : (
        badges.map((b) => (
          <div key={b.tierId} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
            <span>{b.iconSymbol}</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{b.badgeName}</span>
          </div>
        ))
      )}
    </div>
  );
}
