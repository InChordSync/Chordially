export interface CurrencyAmount {
  amountCents: number;
  currency: string;
  formattedText?: string;
}

export interface MonthlyPayoutBreakdown {
  monthYear: string;
  grossTipsCents: number;
  platformFeeCents: number;
  netPayoutCents: number;
  payoutStatus: 'completed' | 'pending' | 'processing';
}

export interface CreatorEarningsSummary {
  creatorId: string;
  lifetimeEarnings: CurrencyAmount;
  pendingPayout: CurrencyAmount;
  currentMonthEarnings: CurrencyAmount;
  recentPayouts: MonthlyPayoutBreakdown[];
}
