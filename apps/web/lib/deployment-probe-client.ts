import {
  livenessProbeResponseSchema,
  readinessProbeResponseSchema,
  type LivenessProbeResponse,
  type ReadinessProbeResponse,
} from '@chordially/shared';
import { getApiBaseUrl } from './api-config';

export async function fetchLivenessProbe(): Promise<LivenessProbeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health/live`);
  if (!res.ok) throw new Error(`Liveness probe failed with ${res.status}`);
  const data = await res.json();
  return livenessProbeResponseSchema.parse(data);
}

export async function fetchReadinessProbe(): Promise<ReadinessProbeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health/ready`);
  if (!res.ok) throw new Error(`Readiness probe failed with ${res.status}`);
  const data = await res.json();
  return readinessProbeResponseSchema.parse(data);
}
