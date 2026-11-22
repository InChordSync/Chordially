import {
  livenessProbeResponseSchema,
  readinessProbeResponseSchema,
  type LivenessProbeResponse,
  type ReadinessProbeResponse,
} from '@chordially/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function fetchLivenessProbe(): Promise<LivenessProbeResponse> {
  const res = await fetch(`${API_BASE_URL}/healthz`);
  const data = await res.json();
  return livenessProbeResponseSchema.parse(data);
}

export async function fetchReadinessProbe(): Promise<ReadinessProbeResponse> {
  const res = await fetch(`${API_BASE_URL}/readyz`);
  const data = await res.json();
  return readinessProbeResponseSchema.parse(data);
}
