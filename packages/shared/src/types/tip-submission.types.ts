export interface PaymentIntentRecord {
  intentId: string;
  creatorId: string;
  senderAddress?: string;
  tipAmountXlm: number;
  status: 'created' | 'submitted' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface StellarTxBuildResult {
  xdrEnvelope: string;
  txHash: string;
  feeChargedStroops: number;
}

export interface TipSubmissionPayload {
  creatorId: string;
  amountXlm: number;
  senderPublicKey: string;
  memoText?: string;
}
