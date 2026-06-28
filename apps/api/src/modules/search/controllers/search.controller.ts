import type { NextFunction, Request, Response } from "express"
import { searchIndexService } from "../services/search-index.service.js"

export const searchController = {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = (req.query["q"] as string) || ""
      if (!q.trim()) {
        res.status(200).json({ results: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
        return
      }

      const page = Math.max(1, parseInt(req.query["page"] as string, 10) || 1)
      const limit = Math.max(1, parseInt(req.query["limit"] as string, 10) || 20)
      const genre = req.query["genre"] as string | undefined
      const location = req.query["location"] as string | undefined

      const result = await searchIndexService.search({ q, genre, location, page, limit })
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },
}
