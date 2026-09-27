import type { TipSubmissionPayloadInput } from '@chordially/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function submitTipToCreator(payload: TipSubmissionPayloadInput) {
  const response = await fetch(`${API_BASE_URL}/api/tips/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit tip transaction to creator');
  }

  return await response.json();
}
