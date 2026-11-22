import { Module } from '@nestjs/common';
import { DepositController } from './controllers/deposit.controller.js';
@Module({ controllers: [DepositController] })
export class DepositModule {}
