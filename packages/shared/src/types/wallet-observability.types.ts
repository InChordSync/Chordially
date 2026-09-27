export type WalletAuditEventType = 'challenge_issued' | 'challenge_verified' | 'challenge_failed' | 'wallet_unlinked';

export interface ChallengeAuditEventMeta {
  sessionId: string;
  maskedWalletAddress: string;
  eventType: WalletAuditEventType;
  ipAddressHash?: string;
}

export interface SanitizedWalletLogPayload {
  eventId: string;
  meta: ChallengeAuditEventMeta;
  timestamp: string;
}
