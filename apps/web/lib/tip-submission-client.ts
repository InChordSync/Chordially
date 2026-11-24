import type { TipSubmissionPayloadInput } from '@chordially/shared';
import { getApiBaseUrl } from './api-config';

export async function submitTipToCreator(payload: TipSubmissionPayloadInput) {
  const response = await fetch(`${getApiBaseUrl()}/api/tips/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit tip transaction to creator');
  }

  return await response.json();
}
