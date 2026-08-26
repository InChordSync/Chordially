export interface StellarAccountReference {
  publicKey: string
}

export interface StellarNetworkConfig {
  network: 'testnet' | 'public'
  horizonUrl: string
  friendbotUrl?: string
}

export interface StellarKeypair {
  publicKey: string
  secretKey: string
}

export interface StellarAccountBalance {
  assetType: string
  assetCode?: string
  balance: string
}

export interface StellarAccount {
  publicKey: string
  sequence: string
  balances: StellarAccountBalance[]
}

export interface StellarPaymentInput {
  sourceSecretKey: string
  destinationPublicKey: string
  /** Decimal string amount of native XLM, e.g. "25" or "25.0000000". */
  amount: string
}

export interface StellarSplitPaymentDestination {
  destinationPublicKey: string
  /** Decimal string amount of native XLM, e.g. "25" or "25.0000000". */
  amount: string
}

export interface StellarSplitPaymentInput {
  sourceSecretKey: string
  /** One Payment operation per entry, submitted atomically in a single transaction. */
  payments: StellarSplitPaymentDestination[]
}

export interface StellarPaymentResult {
  hash: string
  ledger: number
  successful: boolean
}

export interface StellarPaymentRecord {
  hash: string
  from: string
  to: string
  /** Decimal string amount of native XLM. */
  amount: string
  assetType: string
  successful: boolean
  createdAt: string
}

export interface ListPaymentsOptions {
  /** Only return payments recorded at or after this ISO-8601 time. */
  sinceISOTime?: string
  /** Defaults to 50. */
  limit?: number
}

export interface SponsorAccountCreationInput {
  /** Secret key of the platform's sponsor account, which pays the new account's base reserve and the transaction fee. */
  sponsorSecretKey: string
  /** Public key of the new account being created. */
  newAccountPublicKey: string
  /** Secret key of the new account; required to co-sign acceptance of the sponsorship. */
  newAccountSecretKey: string
}
