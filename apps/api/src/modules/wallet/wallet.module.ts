import { Module } from '@nestjs/common';
import { DepositController } from './controllers/deposit.controller.js';
import { WalletController } from './controllers/wallet.controller.js';

@Module({
  controllers: [WalletController, DepositController],
})
export class WalletModule {}
