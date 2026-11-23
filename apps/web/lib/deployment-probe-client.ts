import {
  livenessProbeResponseSchema,
  readinessProbeResponseSchema,
  type LivenessProbeResponse,
  type ReadinessProbeResponse,
} from '@chordially/shared';
import { getApiBaseUrl } from './api-config';

export async function fetchLivenessProbe(): Promise<LivenessProbeResponse> {
  const res = await fetch(`${getApiBaseUrl()}/healthz`);
  const data = await res.json();
  return livenessProbeResponseSchema.parse(data);
}

export async function fetchReadinessProbe(): Promise<ReadinessProbeResponse> {
  const res = await fetch(`${getApiBaseUrl()}/readyz`);
  const data = await res.json();
  return readinessProbeResponseSchema.parse(data);
}
