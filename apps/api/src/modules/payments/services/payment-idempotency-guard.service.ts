import {
  duplicateCheckResultSchema,
  type DuplicateCheckResult,
  type IdempotencyKeyRecord,
} from '@chordially/shared';

export class PaymentIdempotencyGuardService {
  private readonly records: Map<string, IdempotencyKeyRecord> = new Map();

  public checkOrLockKey(key: string): DuplicateCheckResult {
    const existing = this.records.get(key);
    if (existing) {
      return duplicateCheckResultSchema.parse({
        isDuplicate: true,
        previousResponse: existing.responseBody,
        lockedAt: existing.createdAt,
      });
    }

    return duplicateCheckResultSchema.parse({ isDuplicate: false });
  }

  public saveKeyRecord(record: IdempotencyKeyRecord): void {
    this.records.set(record.key, record);
  }
}
