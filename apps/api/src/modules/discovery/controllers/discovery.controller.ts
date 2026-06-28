import type { NextFunction, Request, Response } from "express"
import { discoveryService } from "../services/discovery.service.js"

export const discoveryController = {
  async discover(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId
      const page = Math.max(1, parseInt(req.query["page"] as string, 10) || 1)
      const limit = Math.max(1, parseInt(req.query["limit"] as string, 10) || 20)

      const validSorts = ["freshness", "activity", "followers"] as const
      const sortParam = (req.query["sort"] as string) || "freshness"
      const sort = validSorts.includes(sortParam as typeof validSorts[number])
        ? (sortParam as "freshness" | "activity" | "followers")
        : "freshness"

      const genre = req.query["genre"] as string | undefined
      const location = req.query["location"] as string | undefined

      const result = await discoveryService.discover(userId, {
        genre,
        location,
        sort,
        page,
        limit,
      })

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },
}
