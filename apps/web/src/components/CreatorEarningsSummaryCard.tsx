import React from 'react';
import { TipAmountFormatter } from '@chordially/shared';

interface CreatorEarningsSummaryCardProps {
  lifetimeEarningsCents?: number;
  pendingPayoutCents?: number;
}

export function CreatorEarningsSummaryCard({
  lifetimeEarningsCents = 145000,
  pendingPayoutCents = 12500,
}: CreatorEarningsSummaryCardProps) {
  return (
    <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Creator Earnings Summary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Lifetime Earnings</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>
            {TipAmountFormatter.formatCentsToCurrency(lifetimeEarningsCents)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Pending Payout</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
            {TipAmountFormatter.formatCentsToCurrency(pendingPayoutCents)}
          </div>
        </div>
      </div>
    </div>
  );
}
