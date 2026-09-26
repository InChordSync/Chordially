import { Module } from '@nestjs/common';
import { WalletController } from './controllers/wallet.controller.js';
import { DepositControllerLegacy } from './controllers/deposit.controller.legacy.js';

@Module({
  controllers: [WalletController, DepositControllerLegacy],
})
export class WalletModule {}
