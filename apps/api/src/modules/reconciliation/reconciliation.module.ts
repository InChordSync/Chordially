import { Module } from '@nestjs/common';
import { ReconciliationController } from './controllers/reconciliation.controller.js';

@Module({
  controllers: [ReconciliationController],
})
export class ReconciliationModule {}
