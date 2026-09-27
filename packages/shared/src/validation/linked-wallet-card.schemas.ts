import { z } from 'zod';

export const walletConnectionDetailsSchema = z.object({
  address: z.string().min(1, 'Wallet address is required.'),
  network: z.enum(['mainnet', 'testnet']).default('testnet'),
  linkedAtIso: z.string().min(1),
  isDefaultPayoutWallet: z.boolean().default(true),
});

export const walletAccountCardStateSchema = z.object({
  hasLinkedWallet: z.boolean(),
  wallet: walletConnectionDetailsSchema.optional(),
});

export type WalletConnectionDetailsInput = z.infer<typeof walletConnectionDetailsSchema>;
export type WalletAccountCardStateInput = z.infer<typeof walletAccountCardStateSchema>;
