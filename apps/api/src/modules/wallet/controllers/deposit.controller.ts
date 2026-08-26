import type { NextFunction, Request, Response } from "express"
import { depositService } from "../services/deposit.service.js"
import { createDepositSchema } from "../validators/deposit.validators.js"

export const depositController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const input = createDepositSchema.parse(req.body)

      const deposit = await depositService.initiateDeposit(userId, input.assetCode)

      res.status(201).json(deposit)
    } catch (error) {
      next(error)
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const deposits = await depositService.listDepositsForUser(userId)
      res.status(200).json(deposits)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { id } = req.params

      const deposit = await depositService.refreshDepositStatus(userId, id!)

      res.status(200).json(deposit)
    } catch (error) {
      next(error)
    }
  },
}
