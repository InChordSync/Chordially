import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller.js';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
