import type { NextFunction, Request, Response } from "express"
import { bookmarkService } from "../services/bookmark.service.js"

export const bookmarkController = {
  async bookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { creatorSlug } = req.params
      const bookmark = await bookmarkService.bookmark(userId, creatorSlug!)
      res.status(201).json({ id: bookmark.id, creatorId: bookmark.creatorId, createdAt: bookmark.createdAt.toISOString() })
    } catch (error) {
      next(error)
    }
  },

  async removeBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { creatorSlug } = req.params
      await bookmarkService.removeBookmark(userId, creatorSlug!)
      res.status(200).json({ ok: true })
    } catch (error) {
      next(error)
    }
  },

  async getBookmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
      const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20))
      const result = await bookmarkService.getBookmarks(userId, page, pageSize)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },
}
