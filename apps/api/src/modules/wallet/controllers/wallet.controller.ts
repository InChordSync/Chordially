import type { NextFunction, Request, Response } from 'express'
import { walletLinkService } from '../services/wallet-link.service.js'

export const walletController = {
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await walletLinkService.createSession(req.userId!)
      res.status(201).json({ session })
    } catch (error) {
      next(error)
    }
  },

  async verify(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { challenge, signature, publicKey } = _req.body
      const valid = await walletLinkService.verifyChallenge(challenge, signature, publicKey)
      res.status(200).json({ success: valid, verified: valid })
    } catch (error) {
      next(error)
    }
  },

  async status(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await walletLinkService.getWalletStatus(req.userId!)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async unlink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await walletLinkService.unlinkWallet(req.userId!)
      res.status(200).json({ success: true, message: 'Wallet unlinked' })
    } catch (error) {
      next(error)
    }
  },

  async auditHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await walletLinkService.getAuditHistory(req.userId!)
      res.status(200).json({ entries: history })
    } catch (error) {
      next(error)
    }
  },

  async sep10Challenge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientPublicKey } = req.body
      const payload = await walletLinkService.generateSep10Challenge(clientPublicKey)
      res.status(200).json(payload)
    } catch (error) {
      next(error)
    }
  },
}
