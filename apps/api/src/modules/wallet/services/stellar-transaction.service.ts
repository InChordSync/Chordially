import { createHorizonAdapter } from '@chordially/stellar'
import { randomUUID } from 'crypto'

const STELLAR_NETWORK_CONFIG = {
  horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2024',
}

const horizon = createHorizonAdapter(STELLAR_NETWORK_CONFIG)

export const stellarTransactionService = {
  async buildTipTransaction(input: {
    sourcePublicKey: string
    destinationPublicKey: string
    amount: string
    memo?: string
  }) {
    const memoText = input.memo || `tip-${randomUUID().slice(0, 8)}`
    const sourceAccount = await horizon.getAccount({ publicKey: input.sourcePublicKey })
    const sequence = (sourceAccount as any).sequence || '0'

    return {
      sourcePublicKey: input.sourcePublicKey,
      destinationPublicKey: input.destinationPublicKey,
      amount: input.amount,
      memo: memoText,
      sequence,
      networkPassphrase: STELLAR_NETWORK_CONFIG.networkPassphrase,
      fee: '100',
      // In production this would build a real Stellar transaction XDR
      transactionXdr: `AAAAAgAAAAB...tip-${randomUUID().slice(0, 8)}`,
    }
  },

  async submitTipTransaction(signedXdr: string) {
    const result = await horizon.submitTransaction(signedXdr)
    if (!result.successful) throw new Error('Stellar transaction submission failed')
    return result
  },
}
