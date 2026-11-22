import type { NextFunction, Request, Response } from "express"
import { depositService } from "../services/deposit.service.js"
export const depositController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId!
      const { amount } = req.body as { amount: string }
      const deposit = await depositService.initiateDeposit(userId, amount)
      res.status(201).json(deposit)
    } catch (error) { next(error) }
  },
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId!
      const { depositId } = req.query as { depositId: string }
      const status = await depositService.getDepositStatus(depositId)
      res.status(200).json(status)
    } catch (error) { next(error) }
  }
}
