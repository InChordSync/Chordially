import type { HorizonAdapter } from './horizon-adapter.js'
import type { StellarNetworkConfig } from '../types/index.js'

export function createMockHorizonClient(config?: Partial<StellarNetworkConfig>): HorizonAdapter {
  const balances = new Map<string, { balance: string; assetType: string; assetCode?: string }[]>()

  return {
    async getAccount(reference) {
      return {
        id: reference.publicKey,
        account_id: reference.publicKey,
        balances: balances.get(reference.publicKey) || [{ balance: '10000', assetType: 'native' }],
        last_modified_ledger: 12345,
      }
    },

    async submitTransaction(xdr: string) {
      const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      return { hash, successful: true }
    },

    async getAccountBalances(publicKey: string) {
      return balances.get(publicKey) || [{ balance: '10000', assetType: 'native' }]
    },

    async checkAccountExists(publicKey: string) {
      return true
    },
  }
}
