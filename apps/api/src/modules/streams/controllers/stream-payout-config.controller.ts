import type { NextFunction, Request, Response } from "express"
import { AppError } from "../../../shared/errors/app-error.js"
import { requestUserId } from "../../../shared/middleware/request-user-id.js"
import { streamPayoutConfigService } from "../services/stream-payout-config.service.js"
import { toStreamPayoutConfigResponse, type PayoutPayeeInput } from "../types/payout-config.types.js"

export const streamPayoutConfigController = {
  async set(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hostUserId = requestUserId(req)
      const { id: streamId } = req.params
      const { payees } = req.body as { payees?: unknown }

      if (!Array.isArray(payees)) {
        throw new AppError(400, "VALIDATION_ERROR", "payees must be an array")
      }

      const parsedPayees: PayoutPayeeInput[] = payees.map((payee, index) => {
        if (
          typeof payee !== "object" ||
          payee === null ||
          typeof (payee as { creatorId?: unknown }).creatorId !== "string" ||
          typeof (payee as { percentage?: unknown }).percentage !== "number"
        ) {
          throw new AppError(
            400,
            "VALIDATION_ERROR",
            `payees[${index}] must have a string creatorId and a numeric percentage`
          )
        }
        return payee as PayoutPayeeInput
      })

      const config = await streamPayoutConfigService.setPayoutConfig(
        streamId!,
        hostUserId,
        parsedPayees
      )

      res.status(200).json(toStreamPayoutConfigResponse(config))
    } catch (error) {
      next(error)
    }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: streamId } = req.params
      const config = await streamPayoutConfigService.findByStreamId(streamId!)

      if (!config) {
        throw new AppError(404, "PAYOUT_CONFIG_NOT_FOUND", "No payout config for this stream")
      }

      res.status(200).json(toStreamPayoutConfigResponse(config))
    } catch (error) {
      next(error)
    }
  },
}
