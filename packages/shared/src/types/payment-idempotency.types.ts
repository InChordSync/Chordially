export interface PaymentSubmissionLock {
  idempotencyKey: string;
  lockedAt: string;
  expiresAt: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  previousResponse?: Record<string, unknown>;
  lockedAt?: string;
}

export interface IdempotencyKeyRecord {
  key: string;
  requestPath: string;
  responseBody: Record<string, unknown>;
  statusCode: number;
  createdAt: string;
}
