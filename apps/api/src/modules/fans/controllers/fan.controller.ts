import type { NextFunction, Request, Response } from "express"
import { AppError } from "../../../shared/errors/app-error.js"
import { bookmarkService } from "../services/bookmark.service.js"
import { fanService } from "../services/fan.service.js"
import { toFanResponse } from "../types/fan.types.js"

export const fanController = {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const profile = await fanService.findByUserId(userId)

      if (!profile) {
        throw new AppError(404, "FAN_NOT_FOUND", "Fan profile not found")
      }

      res.status(200).json(toFanResponse(profile))
    } catch (error) {
      next(error)
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { displayName, avatarUrl, genrePrefs } = req.body as {
        displayName?: string
        avatarUrl?: string | null
        genrePrefs?: string[]
      }

      const profile = await fanService.findByUserId(userId)
      if (!profile) {
        throw new AppError(404, "FAN_NOT_FOUND", "Fan profile not found")
      }

      let updated = profile
      if (displayName !== undefined || avatarUrl !== undefined) {
        updated = await fanService.updateFanProfile(
          profile.id,
          { displayName, avatarUrl },
          userId
        )
      }
      if (genrePrefs !== undefined) {
        updated = await fanService.updateGenrePrefs(profile.id, genrePrefs, userId)
      }

      res.status(200).json(toFanResponse(updated))
    } catch (error) {
      next(error)
    }
  },

  async listBookmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const bookmarks = await bookmarkService.listForUser(userId)
      res.status(200).json(bookmarks)
    } catch (error) {
      next(error)
    }
  },

  async createBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { creatorId } = req.body as { creatorId?: string }

      if (typeof creatorId !== "string" || creatorId.length === 0) {
        throw new AppError(400, "VALIDATION_ERROR", "creatorId is required")
      }

      const bookmark = await bookmarkService.create(userId, creatorId)
      res.status(201).json(bookmark)
    } catch (error) {
      next(error)
    }
  },

  async deleteBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { creatorId } = req.params

      await bookmarkService.remove(userId, creatorId!)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },
}
