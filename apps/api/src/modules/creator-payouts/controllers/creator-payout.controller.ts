import type { NextFunction, Request, Response } from "express"
import { creatorPayoutService } from "../services/creator-payout.service.js"
import { createCreatorPayoutSchema } from "../validators/creator-payout.validators.js"

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback
  }
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback
  }
  return parsed
}

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
      const page = parsePositiveInt(req.query.page, 1)
      const pageSize = parsePositiveInt(req.query.pageSize, 20)
      const payouts = await creatorPayoutService.listPayoutsForCreator(userId, page, pageSize)
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
