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
  assetIssuer?: string
  balance: string
}

export interface StellarAccount {
  publicKey: string
  sequence: string
  balances: StellarAccountBalance[]
}

/**
 * Identifies a Stellar asset: `{ code: 'native' }` for XLM, or an issued
 * asset's code + issuer (e.g. USDC). Use the `NATIVE_ASSET` constant for the
 * native case rather than constructing it by hand.
 */
export interface StellarAssetDescriptor {
  code: string
  /** Required for every asset except native XLM. */
  issuer?: string
}

export const NATIVE_ASSET: StellarAssetDescriptor = { code: 'native' }

export interface StellarPaymentInput {
  sourceSecretKey: string
  destinationPublicKey: string
  /** Decimal string amount, e.g. "25" or "25.0000000". */
  amount: string
  /** Defaults to native XLM. */
  asset?: StellarAssetDescriptor
}

export interface StellarSplitPaymentDestination {
  destinationPublicKey: string
  /** Decimal string amount, e.g. "25" or "25.0000000". */
  amount: string
}

export interface StellarSplitPaymentInput {
  sourceSecretKey: string
  /** One Payment operation per entry, submitted atomically in a single transaction. */
  payments: StellarSplitPaymentDestination[]
  /** Applies to every payment in the batch — a split tip is always one asset. Defaults to native XLM. */
  asset?: StellarAssetDescriptor
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
  /** Decimal string amount. */
  amount: string
  assetType: string
  assetCode?: string
  assetIssuer?: string
  successful: boolean
  createdAt: string
}

export interface EstablishTrustlineInput {
  accountSecretKey: string
  asset: StellarAssetDescriptor
  /** When set, this sponsor account covers the trustline's reserve and the transaction fee. */
  sponsorSecretKey?: string
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
