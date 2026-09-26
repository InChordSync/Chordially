import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/users/user.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';

@Module({
  imports: [AuthModule, UserModule, WalletModule],
})
export class AppModule {}
