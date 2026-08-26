import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  NetworkError,
  Networks,
  NotFoundError,
  Operation,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import type { StellarPaymentClient } from './interfaces/index.js'
import type {
  EstablishTrustlineInput,
  ListPaymentsOptions,
  SponsorAccountCreationInput,
  StellarAccount,
  StellarAccountReference,
  StellarAssetDescriptor,
  StellarKeypair,
  StellarNetworkConfig,
  StellarPaymentInput,
  StellarPaymentRecord,
  StellarPaymentResult,
  StellarSplitPaymentInput,
} from './types/index.js'
import { NATIVE_ASSET } from './types/index.js'

const NATIVE_ASSET_TYPES = new Set(['native'])

// Stellar caps a transaction at 100 operations.
const MAX_OPERATIONS_PER_TRANSACTION = 100

const TRANSIENT_TRANSACTION_RESULT_CODES = new Set([
  'tx_bad_seq',
  'tx_too_late',
  'tx_insufficient_fee',
])

// Horizon reports an underfunded source account as a per-operation result
// code (op_underfunded / op_low_reserve) inside a tx_failed envelope, not as
// its own transaction-level result code.
const INSUFFICIENT_BALANCE_OPERATION_RESULT_CODES = new Set([
  'op_underfunded',
  'op_low_reserve',
])

function networkPassphrase(network: StellarNetworkConfig['network']): string {
  return network === 'public' ? Networks.PUBLIC : Networks.TESTNET
}

function transactionResultCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined
  }

  const response = (error as { response?: { data?: unknown } }).response
  const data = response?.data as
    | { extras?: { result_codes?: { transaction?: string } } }
    | undefined

  return data?.extras?.result_codes?.transaction
}

function toSdkAsset(descriptor: StellarAssetDescriptor = NATIVE_ASSET): Asset {
  if (descriptor.code === 'native') {
    return Asset.native()
  }

  if (!descriptor.issuer) {
    throw new Error(`issuer is required for asset ${descriptor.code}`)
  }

  return new Asset(descriptor.code, descriptor.issuer)
}

function operationResultCodes(error: unknown): string[] {
  if (!(error instanceof Error)) {
    return []
  }

  const response = (error as { response?: { data?: unknown } }).response
  const data = response?.data as
    | { extras?: { result_codes?: { operations?: string[] } } }
    | undefined

  return data?.extras?.result_codes?.operations ?? []
}

export class HorizonStellarClient implements StellarPaymentClient {
  private readonly server: Horizon.Server
  private readonly config: StellarNetworkConfig

  constructor(config: StellarNetworkConfig) {
    this.config = config
    this.server = new Horizon.Server(config.horizonUrl)
  }

  generateKeypair(): StellarKeypair {
    const keypair = Keypair.random()
    return { publicKey: keypair.publicKey(), secretKey: keypair.secret() }
  }

  async getAccount(reference: StellarAccountReference): Promise<StellarAccount> {
    const account = await this.server.loadAccount(reference.publicKey)

    return {
      publicKey: account.accountId(),
      sequence: account.sequence,
      balances: account.balances.map((balance) => ({
        assetType: balance.asset_type,
        assetCode: 'asset_code' in balance ? balance.asset_code : undefined,
        assetIssuer: 'asset_issuer' in balance ? balance.asset_issuer : undefined,
        balance: balance.balance,
      })),
    }
  }

  async getNativeBalance(reference: StellarAccountReference): Promise<string> {
    const account = await this.getAccount(reference)
    const native = account.balances.find((balance) => NATIVE_ASSET_TYPES.has(balance.assetType))
    return native?.balance ?? '0'
  }

  async fundTestnetAccount(reference: StellarAccountReference): Promise<void> {
    if (this.config.network !== 'testnet') {
      throw new Error('fundTestnetAccount can only be used on the testnet network')
    }

    if (!this.config.friendbotUrl) {
      throw new Error('friendbotUrl is not configured')
    }

    const response = await fetch(
      `${this.config.friendbotUrl}?addr=${encodeURIComponent(reference.publicKey)}`
    )

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Friendbot funding failed (${response.status}): ${body}`)
    }
  }

  isAccountNotFoundError(error: unknown): boolean {
    return error instanceof NotFoundError
  }

  async submitPayment(input: StellarPaymentInput): Promise<StellarPaymentResult> {
    return this.submitSplitPayment({
      sourceSecretKey: input.sourceSecretKey,
      payments: [
        { destinationPublicKey: input.destinationPublicKey, amount: input.amount },
      ],
      asset: input.asset,
    })
  }

  async submitSplitPayment(input: StellarSplitPaymentInput): Promise<StellarPaymentResult> {
    if (input.payments.length === 0) {
      throw new Error('submitSplitPayment requires at least one payment')
    }

    if (input.payments.length > MAX_OPERATIONS_PER_TRANSACTION) {
      throw new Error(
        `submitSplitPayment supports at most ${MAX_OPERATIONS_PER_TRANSACTION} payments per transaction, got ${input.payments.length}`
      )
    }

    const sourceKeypair = Keypair.fromSecret(input.sourceSecretKey)
    const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey())

    const builder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase(this.config.network),
    })

    const asset = toSdkAsset(input.asset)

    for (const payment of input.payments) {
      builder.addOperation(
        Operation.payment({
          destination: payment.destinationPublicKey,
          asset,
          amount: payment.amount,
        })
      )
    }

    const transaction = builder.setTimeout(30).build()
    transaction.sign(sourceKeypair)

    const result = await this.server.submitTransaction(transaction)

    return { hash: result.hash, ledger: result.ledger, successful: result.successful }
  }

  isTransientSubmissionError(error: unknown): boolean {
    if (error instanceof NetworkError) {
      const code = transactionResultCode(error)
      if (code) {
        return TRANSIENT_TRANSACTION_RESULT_CODES.has(code)
      }
      // A Horizon-side failure with no result code at all (e.g. a 5xx or a
      // connection-level failure surfaced through the SDK) is safe to retry.
      return true
    }

    return false
  }

  async listSentPayments(
    reference: StellarAccountReference,
    options?: ListPaymentsOptions
  ): Promise<StellarPaymentRecord[]> {
    const page = await this.server
      .payments()
      .forAccount(reference.publicKey)
      .order('desc')
      .limit(options?.limit ?? 50)
      .call()

    const sinceMs = options?.sinceISOTime ? new Date(options.sinceISOTime).getTime() : undefined

    interface PaymentLikeRecord {
      type: string
      transaction_hash: string
      from: string
      to: string
      amount: string
      asset_type: string
      asset_code?: string
      asset_issuer?: string
      transaction_successful: boolean
      created_at: string
    }

    return (page.records as unknown as PaymentLikeRecord[])
      .filter((record) => record.type === 'payment')
      .filter((record) => record.from === reference.publicKey)
      .filter((record) => sinceMs === undefined || new Date(record.created_at).getTime() >= sinceMs)
      .map((record) => ({
        hash: record.transaction_hash,
        from: record.from,
        to: record.to,
        amount: record.amount,
        assetType: record.asset_type,
        assetCode: record.asset_code,
        assetIssuer: record.asset_issuer,
        successful: record.transaction_successful,
        createdAt: record.created_at,
      }))
  }

  async sponsorAccountCreation(input: SponsorAccountCreationInput): Promise<StellarPaymentResult> {
    const sponsorKeypair = Keypair.fromSecret(input.sponsorSecretKey)
    const newAccountKeypair = Keypair.fromSecret(input.newAccountSecretKey)

    if (newAccountKeypair.publicKey() !== input.newAccountPublicKey) {
      throw new Error('newAccountSecretKey does not match newAccountPublicKey')
    }

    const sponsorAccount = await this.server.loadAccount(sponsorKeypair.publicKey())

    // Standard sponsored-account-creation shape: the sponsor declares it will
    // cover the new account's reserves, the account is created with a
    // starting balance of 0 XLM (the sponsor's reserve covers it instead),
    // and the new account itself closes out the sponsorship window. The
    // sponsor is the transaction source, so it also pays the network fee —
    // the new user never spends or holds XLM to get their account created.
    const transaction = new TransactionBuilder(sponsorAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase(this.config.network),
    })
      .addOperation(
        Operation.beginSponsoringFutureReserves({
          sponsoredId: input.newAccountPublicKey,
        })
      )
      .addOperation(
        Operation.createAccount({
          destination: input.newAccountPublicKey,
          startingBalance: '0',
        })
      )
      .addOperation(
        Operation.endSponsoringFutureReserves({
          source: input.newAccountPublicKey,
        })
      )
      .setTimeout(30)
      .build()

    transaction.sign(sponsorKeypair, newAccountKeypair)

    const result = await this.server.submitTransaction(transaction)

    return { hash: result.hash, ledger: result.ledger, successful: result.successful }
  }

  async getSponsorBalance(sponsorPublicKey: string): Promise<string> {
    return this.getNativeBalance({ publicKey: sponsorPublicKey })
  }

  isInsufficientSponsorBalanceError(error: unknown): boolean {
    const operationCodes = operationResultCodes(error)
    return operationCodes.some((code) => INSUFFICIENT_BALANCE_OPERATION_RESULT_CODES.has(code))
  }

  async establishTrustline(input: EstablishTrustlineInput): Promise<StellarPaymentResult> {
    const accountKeypair = Keypair.fromSecret(input.accountSecretKey)
    const asset = toSdkAsset(input.asset)

    if (input.sponsorSecretKey) {
      const sponsorKeypair = Keypair.fromSecret(input.sponsorSecretKey)
      const sponsorAccount = await this.server.loadAccount(sponsorKeypair.publicKey())

      const transaction = new TransactionBuilder(sponsorAccount, {
        fee: BASE_FEE,
        networkPassphrase: networkPassphrase(this.config.network),
      })
        .addOperation(
          Operation.beginSponsoringFutureReserves({
            sponsoredId: accountKeypair.publicKey(),
          })
        )
        .addOperation(
          Operation.changeTrust({ asset, source: accountKeypair.publicKey() })
        )
        .addOperation(
          Operation.endSponsoringFutureReserves({ source: accountKeypair.publicKey() })
        )
        .setTimeout(30)
        .build()

      transaction.sign(sponsorKeypair, accountKeypair)

      const result = await this.server.submitTransaction(transaction)
      return { hash: result.hash, ledger: result.ledger, successful: result.successful }
    }

    const account = await this.server.loadAccount(accountKeypair.publicKey())
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: networkPassphrase(this.config.network),
    })
      .addOperation(Operation.changeTrust({ asset }))
      .setTimeout(30)
      .build()

    transaction.sign(accountKeypair)

    const result = await this.server.submitTransaction(transaction)
    return { hash: result.hash, ledger: result.ledger, successful: result.successful }
  }

  async hasTrustline(
    reference: StellarAccountReference,
    asset: StellarAssetDescriptor
  ): Promise<boolean> {
    if (asset.code === 'native') {
      return true
    }

    const account = await this.getAccount(reference)
    return account.balances.some(
      (balance) => balance.assetCode === asset.code && balance.assetIssuer === asset.issuer
    )
  }

  async getAssetBalance(
    reference: StellarAccountReference,
    asset: StellarAssetDescriptor
  ): Promise<string> {
    if (asset.code === 'native') {
      return this.getNativeBalance(reference)
    }

    const account = await this.getAccount(reference)
    const match = account.balances.find(
      (balance) => balance.assetCode === asset.code && balance.assetIssuer === asset.issuer
    )
    return match?.balance ?? '0'
  }

  signTransactionXdr(transactionXdr: string, secretKey: string): string {
    const transaction = new Transaction(transactionXdr, networkPassphrase(this.config.network))
    transaction.sign(Keypair.fromSecret(secretKey))
    return transaction.toXDR()
  }
}
