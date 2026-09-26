import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/users/user.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { CreatorModule } from './modules/creators/creator.module.js';
import { FanModule } from './modules/fans/fan.module.js';
import { DepositModule } from './modules/deposits/deposit.module.js';
import { CreatorPayoutModule } from './modules/creator-payouts/creator-payout.module.js';
import { NotificationModule } from './modules/notifications/notification.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { TipModule } from './modules/tips/tip.module.js';
import { StreamModule } from './modules/streams/stream.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    AuthModule, UserModule, WalletModule, CreatorModule, FanModule, 
    DepositModule, CreatorPayoutModule, NotificationModule, SearchModule, 
    AdminModule, TipModule, StreamModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ]
})
export class AppModule {}
