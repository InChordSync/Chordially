export interface WalletConnectionDetails {
  address: string;
  network: 'mainnet' | 'testnet';
  linkedAtIso: string;
  isDefaultPayoutWallet: boolean;
}

export interface WalletAccountCardState {
  hasLinkedWallet: boolean;
  wallet?: WalletConnectionDetails;
}

export interface WalletUnlinkOptions {
  address: string;
  confirmUnlink: boolean;
}
