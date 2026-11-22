import { Module } from '@nestjs/common';
import { CreatorPayoutController } from './controllers/creator-payout.controller.js';
@Module({ controllers: [CreatorPayoutController] })
export class CreatorPayoutModule {}
