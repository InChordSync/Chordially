import type { StellarWalletContract, WalletOperationResult } from '@chordially/shared'
import { walletLinkService } from './wallet-link.service'
import { stellarTransactionService } from './stellar-transaction.service'
import { paymentIntentService } from './payment-intent.service'

export const stellarWalletContract: StellarWalletContract = {
  async linkWallet(userId, publicKey, network) {
    return walletLinkService.createSession(userId, publicKey, network) as any
  },

  async verifyLink(userId, sessionId, signature) {
    return walletLinkService.verifyLink(sessionId, signature) as any
  },

  async unlinkWallet(userId, sessionId) {
    return walletLinkService.unlink(sessionId, userId) as any
  },

  async getWalletState(userId) {
    return null // would fetch from db
  },

  async initiateSep10(publicKey) {
    return walletLinkService.createSep10Challenge(publicKey) as any
  },

  async verifySep10(challengeTransaction, signature) {
    return walletLinkService.verifySep10(challengeTransaction, signature) as any
  },

  async buildPayment(sourcePublicKey, destinationPublicKey, amount, memo) {
    return stellarTransactionService.buildTipTransaction({ sourcePublicKey, destinationPublicKey, amount, memo })
  },

  async submitPayment(signedXdr) {
    return stellarTransactionService.submitTipTransaction(signedXdr)
  },

  async getPaymentIntent(intentId) {
    return paymentIntentService.get(intentId)
  },
}
