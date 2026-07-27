import React from 'react';
import type { WalletConnectionDetails } from '@chordially/shared';

interface LinkedWalletStatusCardProps {
  wallet?: WalletConnectionDetails;
  onUnlink?: () => void;
}

export function LinkedWalletStatusCard({ wallet, onUnlink }: LinkedWalletStatusCardProps) {
  if (!wallet) {
    return (
      <div style={{ padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#64748b' }}>No wallet currently linked to this account.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>Linked Stellar Wallet</h4>
      <p style={{ margin: '0 0 12px 0', fontFamily: 'monospace', fontSize: '13px', color: '#334155' }}>
        {wallet.address}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
          Network: {wallet.network.toUpperCase()}
        </span>
        {onUnlink && (
          <button onClick={onUnlink} style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            Unlink Wallet
          </button>
        )}
      </div>
    </div>
  );
}
