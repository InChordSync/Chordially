export type WalletLinkStatus = 'pending' | 'active' | 'suspended' | 'unlinked'
export type WalletNetwork = 'testnet' | 'pubnet' | 'futurenet'

export interface WalletLinkState {
  linkId: string
  userId: string
  publicKey: string
  status: WalletLinkStatus
  network: WalletNetwork
  linkedAt: string
  lastVerifiedAt: string
  unlinkedAt: string | null
  sessionExpiresAt: string
}

export interface Sep10Challenge {
  transaction: string
  networkPassphrase: string
  expiresAt: string
}

export interface Sep10Verified {
  token: string
  walletLinkId: string
}
