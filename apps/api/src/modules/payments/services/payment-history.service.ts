import {
  paymentRecordItemSchema,
  type PaymentRecordItem,
} from '@chordially/shared';

export class PaymentHistoryService {
  private readonly transactions: Map<string, PaymentRecordItem[]> = new Map();

  public async getHistory(creatorId: string): Promise<PaymentRecordItem[]> {
    const list = this.transactions.get(creatorId) ?? [];
    return list.map((item) => paymentRecordItemSchema.parse(item));
  }
}
