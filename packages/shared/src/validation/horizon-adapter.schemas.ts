import { z } from 'zod';

export const horizonNetworkConfigSchema = z.object({
  horizonUrl: z.string().url().default('https://horizon-testnet.stellar.org'),
  networkPassphrase: z.string().min(1).default('Test SDF Network ; July 2015'),
  timeoutMs: z.number().int().positive().default(10000),
});

export const horizonAccountResponseSchema = z.object({
  accountId: z.string().startsWith('G').length(56, 'Invalid Stellar public key length.'),
  sequenceNumber: z.string().min(1),
  nativeBalanceXlm: z.string().min(1),
  isFunded: z.boolean(),
});

export type HorizonNetworkConfigInput = z.infer<typeof horizonNetworkConfigSchema>;
export type HorizonAccountResponseInput = z.infer<typeof horizonAccountResponseSchema>;
