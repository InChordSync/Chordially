import { Module } from '@nestjs/common';
import { UserModule } from './modules/users/user.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CreatorModule } from './modules/creators/creator.module.js';
import { CreatorPayoutModule } from './modules/creator-payouts/creator-payout.module.js';
import { TipModule } from './modules/tips/tip.module.js';
import { StreamModule } from './modules/streams/stream.module.js';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module.js';
import { MetricsModule } from './shared/metrics/metrics.module.js';

@Module({
  imports: [
    UserModule,
    WalletModule,
    AuthModule,
    CreatorModule,
    CreatorPayoutModule,
    TipModule,
    StreamModule,
    ReconciliationModule,
    MetricsModule
  ],
})
export class AppModule {}
