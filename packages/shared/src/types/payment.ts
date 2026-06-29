export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded'

export interface PaymentReceipt {
  id: string
  userId: string
  recipientId: string
  amount: number
  currency: string
  status: PaymentStatus
  txHash: string | null
  network: string
  memo: string | null
  createdAt: string
  confirmedAt: string | null
}

export interface PaymentReceiptResponse {
  receipt: PaymentReceipt
}

export interface TipRequest {
  recipientId: string
  amount: number
  currency: string
  memo?: string
}

export interface TipResponse {
  success: boolean
  receipt: PaymentReceipt
}

export interface TransactionConfirmation {
  id: string
  amount: number
  currency: string
  fee: number
  feeAsset: string
  status: PaymentStatus
  txHash: string | null
  from: string
  to: string
  memo: string | null
  createdAt: string
}

export interface EarningsSummary {
  totalEarned: number
  currency: string
  pendingAmount: number
  paidOut: number
  periodStart: string
  periodEnd: string
  breakdown: { source: string; amount: number; count: number }[]
}

export interface CampaignMetadata {
  id: string
  creatorId: string
  title: string
  description: string
  goal: number
  currency: string
  deadline: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  progress: number
  rewardTiers: RewardTier[]
  createdAt: string
}

export interface RewardTier {
  id: string
  label: string
  threshold: number
  description: string
  badgeUrl: string | null
}

export interface RewardEntitlement {
  id: string
  userId: string
  tierId: string
  tierLabel: string
  grantedAt: string
  unlocked: boolean
  badgeUrl: string | null
}

export interface RefundPolicy {
  eligible: boolean
  windowHours: number
  reason: string | null
}

export interface PaymentAnalyticsEvent {
  eventType: 'tip_sent' | 'tip_received' | 'payment_confirmed' | 'payment_failed' | 'refund_issued'
  userId: string
  amount: number
  currency: string
  timestamp: string
  metadata: Record<string, unknown>
}
