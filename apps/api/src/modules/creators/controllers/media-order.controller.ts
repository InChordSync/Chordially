import type { NextFunction, Request, Response } from "express"
import { z } from "zod"
import { AppError } from "../../../shared/errors/app-error.js"
import {
  reorderMedia,
  selectCover,
  type OrderedMediaItem,
} from "../services/creator-media-order.service.js"

const mediaOrderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        isCover: z.boolean(),
      })
    )
    .min(1),
  orderedIds: z.array(z.string()),
  coverId: z.string().optional(),
})

export const mediaOrderController = {
  async updateMediaOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsed = mediaOrderSchema.safeParse(req.body)
      if (!parsed.success) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          parsed.error.issues.map((issue) => issue.message).join(", ")
        )
      }

      const input: OrderedMediaItem[] = parsed.data.items.map((item) => ({
        id: item.id,
        position: 0,
        isCover: item.isCover,
      }))

      const reordered = reorderMedia(input, parsed.data.orderedIds)
      const result = parsed.data.coverId
        ? selectCover(reordered, parsed.data.coverId)
        : reordered

      res.status(200).json({ items: result })
    } catch (error) {
      next(error)
    }
  },
}
