export interface Wallet {
  id: string
  userId: string
  publicKey: string
  encryptedSecret: string
  encryptedDataKey: string
  iv: string
  authTag: string
  network: string
  usdcTrustline: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateWalletInput {
  userId: string
  publicKey: string
  encryptedSecret: string
  encryptedDataKey: string
  iv: string
  authTag: string
  network: string
}

export interface WalletMeResponse {
  publicKey: string
  balance: string
  network: string
  usdcTrustline: boolean
  usdcBalance: string
}

export interface TrustlineResponse {
  usdcTrustline: boolean
}
