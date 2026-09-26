import { Module } from '@nestjs/common';
import { UserModule } from './modules/users/user.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CreatorModule } from './modules/creators/creator.module.js';

@Module({
  imports: [UserModule, WalletModule, AuthModule, CreatorModule],
})
export class AppModule {}
