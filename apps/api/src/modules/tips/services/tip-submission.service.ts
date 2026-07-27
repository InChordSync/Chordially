import {
  tipSubmissionPayloadSchema,
  type PaymentIntentRecord,
  type StellarTxBuildResult,
  type TipSubmissionPayloadInput,
} from '@chordially/shared';

export class TipSubmissionService {
  public async submitCreatorTip(input: TipSubmissionPayloadInput): Promise<{ intent: PaymentIntentRecord; txResult: StellarTxBuildResult }> {
    const validated = tipSubmissionPayloadSchema.parse(input);
    const intent: PaymentIntentRecord = {
      intentId: `pi_${Date.now()}`,
      creatorId: validated.creatorId,
      senderAddress: validated.senderPublicKey,
      tipAmountXlm: validated.amountXlm,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };

    const txResult: StellarTxBuildResult = {
      xdrEnvelope: `AAAAAGX...mock_xdr_${Date.now()}`,
      txHash: `tx_${Math.random().toString(36).substring(2)}`,
      feeChargedStroops: 100,
    };

    return { intent, txResult };
  }
}
