import {
  livenessProbeResponseSchema,
  readinessProbeResponseSchema,
  type LivenessProbeResponse,
  type ReadinessProbeResponse,
} from '@chordially/shared';

export class DeploymentProbesController {
  private readonly startTime = Date.now();

  public getLivenessProbe(): LivenessProbeResponse {
    const payload: LivenessProbeResponse = {
      status: 'live',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
    return livenessProbeResponseSchema.parse(payload);
  }

  public getReadinessProbe(databaseOk = true, cacheOk = true): ReadinessProbeResponse {
    const isReady = databaseOk && cacheOk;
    const payload: ReadinessProbeResponse = {
      status: isReady ? 'ready' : 'not_ready',
      databaseConnected: databaseOk,
      cacheConnected: cacheOk,
      subsystems: [
        { subsystemName: 'postgres', status: databaseOk ? 'healthy' : 'unhealthy', latencyMs: 5 },
        { subsystemName: 'redis', status: cacheOk ? 'healthy' : 'unhealthy', latencyMs: 2 },
      ],
      timestamp: new Date().toISOString(),
    };
    return readinessProbeResponseSchema.parse(payload);
  }
}
