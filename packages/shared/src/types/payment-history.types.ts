export type PaymentTransactionStatus = 'succeeded' | 'processing' | 'failed' | 'refunded';
export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay' | 'crypto_wallet';

export interface PaymentRecordItem {
  transactionId: string;
  senderId: string;
  recipientCreatorId: string;
  amountCents: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  status: PaymentTransactionStatus;
  createdTimestamp: string;
}

export interface PaymentHistoryFilter {
  creatorId?: string;
  status?: PaymentTransactionStatus;
  limit?: number;
}
