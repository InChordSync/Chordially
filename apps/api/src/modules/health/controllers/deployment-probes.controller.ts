import {
  livenessProbeResponseSchema,
  readinessProbeResponseSchema,
  type LivenessProbeResponse,
  type ReadinessProbeResponse,
} from '@chordially/shared';
import {
  dependencyHealthService,
  type DependencyCheckResult,
} from '../services/dependency-health.service.js';

const statusFor = (check: DependencyCheckResult): 'healthy' | 'degraded' | 'unhealthy' =>
  check.ok ? 'healthy' : 'unhealthy';

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

  // Real readiness check: probes the database and cache (each bounded by a
  // timeout in DependencyHealthService) rather than hardcoding ok=true.
  public async getReadinessProbe(): Promise<ReadinessProbeResponse> {
    const [database, cache] = await Promise.all([
      dependencyHealthService.checkDatabase(),
      dependencyHealthService.checkCache(),
    ]);

    const databaseOk = database.ok;
    const cacheOk = cache.ok;
    const isReady = databaseOk && cacheOk;
    const payload: ReadinessProbeResponse = {
      status: isReady ? 'ready' : 'not_ready',
      databaseConnected: databaseOk,
      cacheConnected: cacheOk,
      subsystems: [
        {
          subsystemName: 'postgres',
          status: statusFor(database),
          latencyMs: database.latencyMs,
        },
        {
          subsystemName: 'redis',
          status: statusFor(cache),
          latencyMs: cache.latencyMs,
        },
      ],
      timestamp: new Date().toISOString(),
    };
    return readinessProbeResponseSchema.parse(payload);
  }
}

export const deploymentProbesController = new DeploymentProbesController();
