import React from 'react';
import type { PaymentRecordItem } from '@chordially/shared';

interface PaymentHistoryTableProps {
  records?: PaymentRecordItem[];
}

export function PaymentHistoryTable({ records = [] }: PaymentHistoryTableProps) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '10px 16px' }}>Transaction ID</th>
            <th style={{ padding: '10px 16px' }}>Amount</th>
            <th style={{ padding: '10px 16px' }}>Method</th>
            <th style={{ padding: '10px 16px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '16px', color: '#64748b', textAlign: 'center' }}>
                No recent payment transactions found.
              </td>
            </tr>
          ) : (
            records.map((r) => (
              <tr key={r.transactionId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{r.transactionId}</td>
                <td style={{ padding: '10px 16px', fontWeight: 'bold' }}>${(r.amountCents / 100).toFixed(2)}</td>
                <td style={{ padding: '10px 16px' }}>{r.paymentMethod}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: r.status === 'succeeded' ? '#dcfce7' : '#fee2e2', color: r.status === 'succeeded' ? '#166534' : '#991b1b', fontSize: '12px' }}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
