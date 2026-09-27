import { z } from 'zod';

export const walletChallengeStatusSchema = z.enum(['issued', 'verified', 'expired', 'failed']);

export const walletLinkChallengeSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required.'),
  userId: z.string().min(1, 'User ID is required.'),
  walletAddress: z.string().min(10, 'Wallet address is invalid.'),
  nonce: z.string().min(8),
  challengeMessage: z.string().min(1),
  status: walletChallengeStatusSchema.default('issued'),
  expiresAt: z.string().min(1),
});

export const signatureVerificationPayloadSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required.'),
  signature: z.string().min(1, 'Signature is required.'),
  publicKey: z.string().min(1, 'Public key is required.'),
});

export type WalletLinkChallengeSessionInput = z.infer<typeof walletLinkChallengeSessionSchema>;
export type SignatureVerificationPayloadInput = z.infer<typeof signatureVerificationPayloadSchema>;
