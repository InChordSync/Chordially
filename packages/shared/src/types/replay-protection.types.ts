export interface NonceReplayCacheOptions {
  ttlSeconds: number;
  maxCacheEntries: number;
}

export interface ChallengeValidationResult {
  isValid: boolean;
  reason?: 'expired' | 'already_used' | 'invalid_signature';
  validatedAt: string;
}

export interface ReplayAttemptRecord {
  nonce: string;
  walletAddress: string;
  ipAddress?: string;
  attemptTimestamp: string;
}
