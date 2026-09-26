import { Module } from '@nestjs/common';
import { TipController } from './controllers/tip.controller.js';

@Module({
  controllers: [TipController],
})
export class TipModule {}
