import type { StellarAccountReference, StellarNetworkConfig } from '../types/index.js'

export interface HorizonAdapter {
  getAccount(reference: StellarAccountReference): Promise<unknown>
  submitTransaction(xdr: string): Promise<{ hash: string; successful: boolean }>
  getAccountBalances(publicKey: string): Promise<{ balance: string; assetType: string; assetCode?: string }[]>
  checkAccountExists(publicKey: string): Promise<boolean>
}

export function createHorizonAdapter(config: StellarNetworkConfig): HorizonAdapter {
  const baseUrl = config.horizonUrl

  return {
    async getAccount(reference: StellarAccountReference) {
      const res = await fetch(`${baseUrl}/accounts/${reference.publicKey}`)
      if (!res.ok) throw new Error(`Horizon error: ${res.status}`)
      return res.json()
    },

    async submitTransaction(xdr: string) {
      const res = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ tx: xdr }),
      })
      const data = await res.json()
      return { hash: data.hash || '', successful: res.ok }
    },

    async getAccountBalances(publicKey: string) {
      const data: any = await this.getAccount({ publicKey })
      return (data.balances || []).map((b: any) => ({
        balance: b.balance,
        assetType: b.asset_type,
        assetCode: b.asset_code,
      }))
    },

    async checkAccountExists(publicKey: string) {
      try {
        await this.getAccount({ publicKey })
        return true
      } catch {
        return false
      }
    },
  }
}
