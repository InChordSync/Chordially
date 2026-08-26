import type { NextFunction, Request, Response } from "express"
import { creatorPayoutService } from "../services/creator-payout.service.js"
import { createCreatorPayoutSchema } from "../validators/creator-payout.validators.js"

export const creatorPayoutController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const input = createCreatorPayoutSchema.parse(req.body)

      const payout = await creatorPayoutService.initiatePayout(
        userId,
        input.amount,
        input.assetCode,
        input.idempotencyKey
      )

      res.status(201).json(payout)
    } catch (error) {
      next(error)
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const payouts = await creatorPayoutService.listPayoutsForCreator(userId)
      res.status(200).json(payouts)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { id } = req.params

      const payout = await creatorPayoutService.refreshPayoutStatus(userId, id!)

      res.status(200).json(payout)
    } catch (error) {
      next(error)
    }
  },
}
