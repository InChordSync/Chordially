export type PaymentIntentStatus = 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired'

export interface PaymentIntent {
  id: string
  userId: string
  recipientId: string
  amount: string
  currency: string
  network: string
  memo: string | null
  status: PaymentIntentStatus
  stellarTxHash: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentIntentInput {
  recipientId: string
  amount: string
  currency: string
  network: string
  memo?: string
}

export interface PaymentIntentConfirmation {
  intentId: string
  stellarTxHash: string
  status: PaymentIntentStatus
}
