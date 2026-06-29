import type { NextFunction, Request, Response } from 'express'
import { paymentService } from '../services/payment.service.js'

export const paymentController = {
  async tip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recipientId, amount, currency, memo } = req.body
      const receipt = await paymentService.createReceipt({
        userId: req.userId!,
        recipientId,
        amount,
        currency: currency || 'XLM',
        network: 'stellar',
        memo,
      })
      res.status(201).json({ receipt })
    } catch (error) {
      next(error)
    }
  },

  async receipts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipts = await paymentService.getUserReceipts(req.userId!)
      res.status(200).json({ receipts })
    } catch (error) {
      next(error)
    }
  },

  async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipt = await paymentService.getReceipt(req.params.id)
      if (!receipt) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Receipt not found' } }); return }
      res.status(200).json({ receipt })
    } catch (error) {
      next(error)
    }
  },

  async earnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await paymentService.getEarningsSummary(req.userId!)
      res.status(200).json({ summary })
    } catch (error) {
      next(error)
    }
  },

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { txHash } = req.body
      const receipt = await paymentService.confirmReceipt(req.params.id, txHash)
      res.status(200).json({ receipt })
    } catch (error) {
      next(error)
    }
  },
}
