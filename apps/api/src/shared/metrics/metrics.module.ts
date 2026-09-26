import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller.js';

@Module({
  controllers: [MetricsController],
})
export class MetricsModule {}
