import type { NextFunction, Request, Response } from "express"
import { AppError } from "../../../shared/errors/app-error.js"
import { tipFanRateLimiter, tipStreamRateLimiter } from "../services/tip-rate-limiters.js"
import { tipService } from "../services/tip.service.js"
import { createTipSchema } from "../validators/tip.validators.js"

export const tipController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fanUserId = req.userId!
      const input = createTipSchema.parse(req.body)

      if (!tipFanRateLimiter.consume(fanUserId)) {
        throw new AppError(429, "RATE_LIMITED", "You're sending tips too quickly. Try again shortly.")
      }

      if (input.streamId && !tipStreamRateLimiter.consume(input.streamId)) {
        throw new AppError(
          429,
          "STREAM_RATE_LIMITED",
          "This stream is receiving too many tips right now. Try again shortly."
        )
      }

      const tip = await tipService.submitTip({ ...input, fanUserId })

      res.status(201).json(tip)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fanUserId = req.userId!
      const { id } = req.params

      const tip = await tipService.getTipForFan(id!, fanUserId)

      res.status(200).json(tip)
    } catch (error) {
      next(error)
    }
  },

  async submitSigned(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fanUserId = req.userId!
      const { id } = req.params
      const { signedTransactionXdr } = req.body as { signedTransactionXdr?: unknown }

      if (typeof signedTransactionXdr !== "string" || signedTransactionXdr.length === 0) {
        throw new AppError(400, "VALIDATION_ERROR", "signedTransactionXdr is required")
      }

      const tip = await tipService.submitSignedTip(id!, fanUserId, signedTransactionXdr)

      res.status(200).json(tip)
    } catch (error) {
      next(error)
    }
  },

  async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fanUserId = req.userId!
      const { id } = req.params

      if (!tipFanRateLimiter.consume(fanUserId)) {
        throw new AppError(429, "RATE_LIMITED", "You're sending tips too quickly. Try again shortly.")
      }

      const tip = await tipService.retryTip(id!, fanUserId)

      res.status(201).json(tip)
    } catch (error) {
      next(error)
    }
  },
}
