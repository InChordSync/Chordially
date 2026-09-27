import { stellarClient } from "../stellar/client.js"

/**
 * SEP-24's own transaction status values. `incomplete` is the anchor's
 * initial state before the user finishes the interactive flow;
 * `completed`/`error`/`expired` are terminal.
 */
export type Sep24TransactionStatus =
  | "incomplete"
  | "pending_user_transfer_start"
  | "pending_anchor"
  | "completed"
  | "error"
  | "expired"

export interface Sep24TransactionInfo {
  status: Sep24TransactionStatus
  amountIn?: string
  message?: string
  /**
   * Withdrawal-only: the Stellar account the anchor wants the on-chain
   * payment sent to, and an optional memo identifying this withdrawal to
   * the anchor. Populated once the anchor is ready to receive funds
   * (typically once status reaches "pending_user_transfer_start").
   */
  withdrawAnchorAccount?: string
  withdrawMemo?: string
}

export interface StartInteractiveDepositInput {
  token: string
  assetCode: string
  account: string
}

export interface StartInteractiveWithdrawalInput {
  token: string
  assetCode: string
  account: string
}

export interface StartInteractiveSessionResult {
  /** The anchor's own id for this transaction, used for status polling. */
  id: string
  /** URL the client opens to complete KYC/payout details with the anchor. */
  url: string
}

export type StartInteractiveDepositResult = StartInteractiveSessionResult

/**
 * Client for an anchor's SEP-10 (web auth) + SEP-24 (interactive
 * deposit/withdrawal) endpoints. Kept as an interface so tests can supply a
 * fake anchor rather than making real network calls, the same way
 * StellarPaymentClient decouples the rest of the app from Horizon.
 */
export interface Sep24AnchorClient {
  /** Step 1 of SEP-10: request a signable challenge transaction for the given account. */
  requestChallenge(accountPublicKey: string): Promise<{ transactionXdr: string }>

  /** Step 2 of SEP-10: submit the signed challenge and receive a bearer token for SEP-24 calls. */
  submitChallenge(signedTransactionXdr: string): Promise<{ token: string }>

  /** Starts an interactive deposit session for the given asset/account. */
  startInteractiveDeposit(
    input: StartInteractiveDepositInput
  ): Promise<StartInteractiveDepositResult>

  /** Starts an interactive withdrawal session for the given asset/account. */
  startInteractiveWithdrawal(
    input: StartInteractiveWithdrawalInput
  ): Promise<StartInteractiveSessionResult>

  /** Fetches the anchor's current view of a transaction's status. */
  fetchTransaction(input: { token: string; id: string }): Promise<Sep24TransactionInfo>
}

interface HttpAnchorClientConfig {
  baseUrl: string
}

/**
 * Real HTTP implementation, following SEP-10 (https://stellar.org/protocol/sep-10)
 * and SEP-24 (https://stellar.org/protocol/sep-24). Point `baseUrl` at any
 * compliant anchor; for local development this is a testnet reference
 * anchor, and swapping in a licensed mainnet anchor later is a config
 * change here, not a rewrite of the calling code.
 */
export class HttpAnchorClient implements Sep24AnchorClient {
  constructor(private readonly config: HttpAnchorClientConfig) {}

  async requestChallenge(accountPublicKey: string): Promise<{ transactionXdr: string }> {
    const response = await fetch(
      `${this.config.baseUrl}/auth?account=${encodeURIComponent(accountPublicKey)}`
    )

    if (!response.ok) {
      throw new Error(`Anchor SEP-10 challenge request failed (${response.status})`)
    }

    const body = (await response.json()) as { transaction: string }
    return { transactionXdr: body.transaction }
  }

  async submitChallenge(signedTransactionXdr: string): Promise<{ token: string }> {
    const response = await fetch(`${this.config.baseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: signedTransactionXdr }),
    })

    if (!response.ok) {
      throw new Error(`Anchor SEP-10 challenge submission failed (${response.status})`)
    }

    const body = (await response.json()) as { token: string }
    return { token: body.token }
  }

  async startInteractiveDeposit(
    input: StartInteractiveDepositInput
  ): Promise<StartInteractiveDepositResult> {
    const response = await fetch(`${this.config.baseUrl}/transactions/deposit/interactive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${input.token}`,
      },
      body: new URLSearchParams({ asset_code: input.assetCode, account: input.account }),
    })

    if (!response.ok) {
      throw new Error(`Anchor interactive deposit request failed (${response.status})`)
    }

    const body = (await response.json()) as { id: string; url: string }
    return { id: body.id, url: body.url }
  }

  async startInteractiveWithdrawal(
    input: StartInteractiveWithdrawalInput
  ): Promise<StartInteractiveSessionResult> {
    const response = await fetch(`${this.config.baseUrl}/transactions/withdraw/interactive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${input.token}`,
      },
      body: new URLSearchParams({ asset_code: input.assetCode, account: input.account }),
    })

    if (!response.ok) {
      throw new Error(`Anchor interactive withdrawal request failed (${response.status})`)
    }

    const body = (await response.json()) as { id: string; url: string }
    return { id: body.id, url: body.url }
  }

  async fetchTransaction(input: { token: string; id: string }): Promise<Sep24TransactionInfo> {
    const response = await fetch(
      `${this.config.baseUrl}/transaction?id=${encodeURIComponent(input.id)}`,
      { headers: { Authorization: `Bearer ${input.token}` } }
    )

    if (!response.ok) {
      throw new Error(`Anchor transaction status request failed (${response.status})`)
    }

    const body = (await response.json()) as {
      transaction: {
        status: Sep24TransactionStatus
        amount_in?: string
        message?: string
        withdraw_anchor_account?: string
        withdraw_memo?: string
      }
    }

    return {
      status: body.transaction.status,
      amountIn: body.transaction.amount_in,
      message: body.transaction.message,
      withdrawAnchorAccount: body.transaction.withdraw_anchor_account,
      withdrawMemo: body.transaction.withdraw_memo,
    }
  }
}

/**
 * Completes the SEP-10 handshake for a custodial account: fetches the
 * anchor's challenge, signs it with the account's own key (the platform
 * holds custody, so it signs on the user's behalf, same as tip submission),
 * and exchanges it for a bearer token.
 */
export async function authenticateWithAnchor(
  anchorClient: Sep24AnchorClient,
  accountPublicKey: string,
  accountSecretKey: string
): Promise<string> {
  const { transactionXdr } = await anchorClient.requestChallenge(accountPublicKey)
  const signedXdr = stellarClient.signTransactionXdr(transactionXdr, accountSecretKey)
  const { token } = await anchorClient.submitChallenge(signedXdr)
  return token
}
