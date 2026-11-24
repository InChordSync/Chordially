import { Controller, Get, Res, Next } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import { env } from '../../../shared/config/env.js';
import { deploymentProbesController } from './deployment-probes.controller.js';
import { dependencyHealthService } from '../services/dependency-health.service.js';
import { Public } from '../../../shared/decorators/public.decorator.js';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  async check(@Res() res: Response, @Next() next: NextFunction) {
    try {
      const [database, cache] = await Promise.all([
        dependencyHealthService.checkDatabase(),
        dependencyHealthService.checkCache(),
      ]);
      const memory = dependencyHealthService.checkMemory();
      const ok = database.ok && cache.ok && memory.ok;

      return res.status(ok ? 200 : 503).json({
        status: ok ? 'ok' : 'degraded',
        uptimeSeconds: Math.floor(process.uptime()),
        checks: {
          database: { status: database.ok ? 'up' : 'down', latencyMs: database.latencyMs },
          cache: { status: cache.ok ? 'up' : 'down', latencyMs: cache.latencyMs },
          memory: {
            status: memory.ok ? 'ok' : 'over_limit',
            usedMb: memory.usedMb,
            limitMb: memory.limitMb,
          },
        },
        heapLimitMb: env.HEALTH_HEAP_LIMIT_MB,
        timestamp: new Date().toISOString(),
      });
    } catch (error) { next(error); }
  }

  @Get('live')
  live(@Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json(deploymentProbesController.getLivenessProbe());
    } catch (error) { next(error); }
  }

  @Get('ready')
  async ready(@Res() res: Response, @Next() next: NextFunction) {
    try {
      const readiness = await deploymentProbesController.getReadinessProbe();
      return res.status(readiness.status === 'ready' ? 200 : 503).json(readiness);
    } catch (error) { next(error); }
  }
}
