import type { Sep10Challenge, Sep10Verified, WalletLinkState } from './wallet-link'
import type { PaymentIntent } from './payment-intent'

export interface StellarWalletContract {
  linkWallet(userId: string, publicKey: string, network: string): Promise<WalletLinkState>
  verifyLink(userId: string, sessionId: string, signature: string): Promise<WalletLinkState>
  unlinkWallet(userId: string, sessionId: string): Promise<WalletLinkState>
  getWalletState(userId: string): Promise<WalletLinkState | null>
  initiateSep10(publicKey: string): Promise<Sep10Challenge>
  verifySep10(challengeTransaction: string, signature: string): Promise<Sep10Verified>
  buildPayment(sourcePublicKey: string, destinationPublicKey: string, amount: string, memo?: string): Promise<{ transactionXdr: string; fee: string }>
  submitPayment(signedXdr: string): Promise<{ hash: string; successful: boolean }>
  getPaymentIntent(intentId: string): Promise<PaymentIntent | null>
}

export interface WalletOperationResult<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
