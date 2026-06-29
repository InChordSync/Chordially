import type { Request, Response } from 'express'
import { paymentIntentService } from '../services/payment-intent.service'
import { stellarTransactionService } from '../services/stellar-transaction.service'

export const paymentIntentController = {
  async create(req: Request, res: Response) {
    const intent = await paymentIntentService.create(req.user!.sub, req.body)
    res.status(201).json(intent)
  },

  async get(req: Request, res: Response) {
    const intent = await paymentIntentService.get(req.params.id)
    if (!intent) return res.status(404).json({ error: 'Intent not found' })
    res.json(intent)
  },
}
