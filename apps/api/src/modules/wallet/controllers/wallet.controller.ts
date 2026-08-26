import type { NextFunction, Request, Response } from "express"
import { walletService } from "../services/wallet.service.js"

export const walletController = {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const wallet = await walletService.getWalletForUser(userId)
      res.status(200).json(wallet)
    } catch (error) {
      next(error)
    }
  },

  async establishUsdcTrustline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const result = await walletService.establishUsdcTrustline(userId)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },
}
