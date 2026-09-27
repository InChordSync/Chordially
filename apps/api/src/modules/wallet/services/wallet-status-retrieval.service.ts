import {
  walletAccountCardStateSchema,
  type WalletAccountCardState,
} from '@chordially/shared';

export class WalletStatusRetrievalService {
  public async getAccountWalletStatus(userId: string): Promise<WalletAccountCardState> {
    const raw: WalletAccountCardState = {
      hasLinkedWallet: true,
      wallet: {
        address: `GBXTEST${userId.substring(0, 8).toUpperCase()}`,
        network: 'testnet',
        linkedAtIso: new Date().toISOString(),
        isDefaultPayoutWallet: true,
      },
    };
    return walletAccountCardStateSchema.parse(raw);
  }
}
