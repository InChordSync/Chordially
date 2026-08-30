import type { NextFunction, Request, Response } from "express"
import { depositService } from "../services/deposit.service.js"
import { createDepositSchema } from "../validators/deposit.validators.js"

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
      const page = parsePositiveInt(req.query.page, 1)
      const pageSize = parsePositiveInt(req.query.pageSize, 20)
      const deposits = await depositService.listDepositsForUser(userId, page, pageSize)
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
