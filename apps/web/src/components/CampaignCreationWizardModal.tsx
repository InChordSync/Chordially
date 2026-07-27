import React, { useState } from 'react';
import type { CampaignWizardStep } from '@chordially/shared';

interface CampaignCreationWizardModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function CampaignCreationWizardModal({ isOpen, onClose }: CampaignCreationWizardModalProps) {
  const [step, setStep] = useState<CampaignWizardStep>('basic_info');

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '520px', width: '100%' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Create New Creator Campaign</h3>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Current Step: {step.replace('_', ' ').toUpperCase()}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => setStep('goal_setting')} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Next Step
          </button>
        </div>
      </div>
    </div>
  );
}
