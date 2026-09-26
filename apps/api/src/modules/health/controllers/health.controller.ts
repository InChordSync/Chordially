import { Controller, Get, Req, Res, Next } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}

@Controller('metrics')
export class MetricsController {
  @Get()
  getMetrics() {
    // N-100: Prometheus format metrics
    return "http_requests_total 100";
  }
}
