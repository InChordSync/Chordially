import { z } from 'zod';

export const walletAuditEventTypeSchema = z.enum([
  'challenge_issued',
  'challenge_verified',
  'challenge_failed',
  'wallet_unlinked',
]);

export const challengeAuditEventMetaSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required.'),
  maskedWalletAddress: z.string().min(6, 'Masked address is invalid.'),
  eventType: walletAuditEventTypeSchema,
  ipAddressHash: z.string().optional(),
});

export const sanitizedWalletLogPayloadSchema = z.object({
  eventId: z.string().min(1),
  meta: challengeAuditEventMetaSchema,
  timestamp: z.string().min(1),
});

export type ChallengeAuditEventMetaInput = z.infer<typeof challengeAuditEventMetaSchema>;
export type SanitizedWalletLogPayloadInput = z.infer<typeof sanitizedWalletLogPayloadSchema>;
