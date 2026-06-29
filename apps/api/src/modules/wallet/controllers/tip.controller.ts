import type { Request, Response } from 'express'
import { stellarTransactionService } from '../services/stellar-transaction.service'
import { paymentIntentService } from '../services/payment-intent.service'

export const tipController = {
  async build(req: Request, res: Response) {
    const { sourcePublicKey, destinationPublicKey, amount, memo } = req.body
    const tx = await stellarTransactionService.buildTipTransaction({
      sourcePublicKey, destinationPublicKey, amount, memo,
    })
    res.json(tx)
  },

  async submit(req: Request, res: Response) {
    const { signedXdr, intentId } = req.body
    const result = await stellarTransactionService.submitTipTransaction(signedXdr)
    const intent = await paymentIntentService.confirm(intentId, result.hash)
    res.json({ hash: result.hash, intent })
  },
}
