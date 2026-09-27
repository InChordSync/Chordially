import {
  fanEntitlementRecordSchema,
  type FanEntitlementRecord,
} from '@chordially/shared';

export class RewardEntitlementService {
  public evaluateFanThreshold(fanId: string, creatorId: string, totalSupportCents: number): FanEntitlementRecord | null {
    if (totalSupportCents < 5000) return null;

    const raw: FanEntitlementRecord = {
      entitlementId: `ent_${Date.now()}`,
      fanId,
      creatorId,
      unlockedTier: {
        tierId: 'tier_gold',
        badgeName: 'Gold Backer Badge',
        iconSymbol: '🥇',
        criterion: { minSupportCents: 5000, currency: 'USD' },
      },
      unlockedAtIso: new Date().toISOString(),
    };

    return fanEntitlementRecordSchema.parse(raw);
  }
}
