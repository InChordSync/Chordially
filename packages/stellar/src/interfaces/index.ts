import type {
  EstablishTrustlineInput,
  ListPaymentsOptions,
  SponsorAccountCreationInput,
  StellarAccount,
  StellarAccountReference,
  StellarAssetDescriptor,
  StellarKeypair,
  StellarPaymentInput,
  StellarPaymentRecord,
  StellarPaymentResult,
  StellarSplitPaymentInput,
} from '../types/index.js'

export interface StellarPaymentClient {
  /** Generates a new Stellar keypair. Does not touch the network. */
  generateKeypair(): StellarKeypair

  /** Fetches an account's current state (sequence number, balances) from Horizon. */
  getAccount(reference: StellarAccountReference): Promise<StellarAccount>

  /** Convenience helper returning the native XLM balance as a string, e.g. "0.0000000". */
  getNativeBalance(reference: StellarAccountReference): Promise<string>

  /** Funds a testnet account via Friendbot. Only valid on the testnet network. */
  fundTestnetAccount(reference: StellarAccountReference): Promise<void>

  /** True if the given error means the account doesn't exist on the ledger yet. */
  isAccountNotFoundError(error: unknown): boolean

  /**
   * Builds, signs, and submits a native XLM payment. Horizon's submit
   * endpoint blocks until the transaction has been applied to a ledger, so a
   * resolved promise means the payment is already confirmed.
   */
  submitPayment(input: StellarPaymentInput): Promise<StellarPaymentResult>

  /**
   * Builds, signs, and submits a single transaction containing one native
   * XLM Payment operation per destination. Stellar transactions are atomic,
   * so this either pays every destination or none of them.
   */
  submitSplitPayment(input: StellarSplitPaymentInput): Promise<StellarPaymentResult>

  /**
   * True if a submission failure is transient and safe to retry (timeouts,
   * network errors, stale sequence numbers). False for failures that will
   * never succeed on retry (insufficient balance, malformed transaction,
   * unknown destination, etc).
   */
  isTransientSubmissionError(error: unknown): boolean

  /**
   * Lists payments sent *from* this account, most recent first. Used for
   * reconciliation: matching a locally stuck-in-flight payment against what
   * actually happened on the ledger, when the local process never received
   * (or never persisted) the submission result.
   */
  listSentPayments(
    reference: StellarAccountReference,
    options?: ListPaymentsOptions
  ): Promise<StellarPaymentRecord[]>

  /**
   * Creates a new account on the ledger sponsored by the platform's sponsor
   * account: the sponsor pays the new account's base reserve and the
   * transaction fee, so the new user never needs to hold XLM before their
   * first transaction. Works on any network, unlike `fundTestnetAccount`.
   */
  sponsorAccountCreation(input: SponsorAccountCreationInput): Promise<StellarPaymentResult>

  /** Convenience helper returning the sponsor account's native XLM balance, for low-balance monitoring. */
  getSponsorBalance(sponsorPublicKey: string): Promise<string>

  /**
   * True if a sponsorship/account-creation failure happened because the
   * sponsor account itself doesn't have enough XLM to cover the new
   * account's reserve. Distinguishes "we're out of runway" from any other
   * submission failure, so callers can fail loudly with a specific error
   * instead of leaving a half-created account.
   */
  isInsufficientSponsorBalanceError(error: unknown): boolean

  /**
   * Establishes a trustline from an account to an issued asset (e.g. USDC),
   * required before that account can hold or receive it. When
   * `sponsorSecretKey` is set, the sponsor covers the trustline's reserve
   * and the transaction fee, matching how new accounts themselves are
   * sponsored.
   */
  establishTrustline(input: EstablishTrustlineInput): Promise<StellarPaymentResult>

  /** True if the account already trusts the given asset (per its current Horizon balance lines). */
  hasTrustline(reference: StellarAccountReference, asset: StellarAssetDescriptor): Promise<boolean>

  /** Reads an account's balance in a specific asset. Returns "0" if the account has no trustline (or balance) in it. */
  getAssetBalance(reference: StellarAccountReference, asset: StellarAssetDescriptor): Promise<string>

  /**
   * Signs an arbitrary base64 transaction envelope XDR with the given
   * secret key and returns the signed envelope, base64-encoded. Used for
   * SEP-10 web-auth challenges, which arrive as XDR the anchor hands us to
   * sign, not as a transaction we build ourselves.
   */
  signTransactionXdr(transactionXdr: string, secretKey: string): string
}
