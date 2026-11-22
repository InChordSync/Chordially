import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController, MetricsController } from './controllers/health.controller.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, MetricsController],
})
export class HealthModule {}
