import React, { useState } from 'react';
import type { LinkStepState } from '@chordially/shared';

export function WalletChallengeInitiationForm() {
  const [address, setAddress] = useState('');
  const [step, setStep] = useState<LinkStepState>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setStep('generating_challenge');
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Link Stellar Wallet</h3>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Stellar Public Key</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="G..."
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
        />
      </div>
      <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        {step === 'generating_challenge' ? 'Generating Challenge...' : 'Initiate Challenge'}
      </button>
    </form>
  );
}
