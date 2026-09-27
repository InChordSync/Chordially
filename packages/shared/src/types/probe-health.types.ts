export interface SubsystemHealthStatus {
  subsystemName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
}

export interface LivenessProbeResponse {
  status: 'live' | 'dead';
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadinessProbeResponse {
  status: 'ready' | 'not_ready';
  databaseConnected: boolean;
  cacheConnected: boolean;
  subsystems: SubsystemHealthStatus[];
  timestamp: string;
}
