export type WalletType = "custodial" | "linked"

export interface Wallet {
  id: string
  userId: string
  publicKey: string
  walletType: string
  /** Null for a linked wallet — the platform never holds its secret key. */
  encryptedSecret: string | null
  encryptedDataKey: string | null
  iv: string | null
  authTag: string | null
  network: string
  usdcTrustline: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateCustodialWalletInput {
  userId: string
  publicKey: string
  encryptedSecret: string
  encryptedDataKey: string
  iv: string
  authTag: string
  network: string
}

export interface CreateLinkedWalletInput {
  userId: string
  publicKey: string
  network: string
}

export interface WalletMeResponse {
  publicKey: string
  balance: string
  network: string
  walletType: WalletType
  usdcTrustline: boolean
  usdcBalance: string
}

export interface TrustlineResponse {
  usdcTrustline: boolean
}
