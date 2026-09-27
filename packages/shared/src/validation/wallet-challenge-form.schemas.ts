import { z } from 'zod';

export const walletInitiationFormDataSchema = z.object({
  publicAddress: z.string().min(10, 'Public wallet address is required and must be valid.'),
  network: z.enum(['mainnet', 'testnet']).default('testnet'),
});

export const challengeResponsePayloadSchema = z.object({
  challengeId: z.string().min(1),
  nonce: z.string().min(8),
  signMessage: z.string().min(1),
  expiresAtIso: z.string().min(1),
});

export type WalletInitiationFormDataInput = z.infer<typeof walletInitiationFormDataSchema>;
export type ChallengeResponsePayloadInput = z.infer<typeof challengeResponsePayloadSchema>;
