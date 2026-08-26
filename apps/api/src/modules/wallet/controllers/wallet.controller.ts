import type { NextFunction, Request, Response } from "express"
import { AppError } from "../../../shared/errors/app-error.js"
import { issueWalletLinkChallenge } from "../../../shared/wallet-link/challenge.js"
import { walletService } from "../services/wallet.service.js"

export const walletController = {
  /**
   * Unauthenticated by design: proving control of an external wallet is
   * how a brand-new user links one during registration, before they have
   * a session of their own.
   */
  getLinkChallenge(req: Request, res: Response, next: NextFunction): void {
    try {
      const publicKey = req.query.publicKey
      if (typeof publicKey !== "string" || !/^G[A-Z0-9]{55}$/.test(publicKey)) {
        throw new AppError(400, "VALIDATION_ERROR", "A valid Stellar publicKey query param is required")
      }

      const { challenge, nonce } = issueWalletLinkChallenge(publicKey)
      // The client needs the raw nonce to know exactly what bytes to sign;
      // `challenge` is the opaque token it hands back afterward so the
      // server can re-derive and verify against that same nonce.
      res.status(200).json({ challenge, nonce })
    } catch (error) {
      next(error)
    }
  },

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
