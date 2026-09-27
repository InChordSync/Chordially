import type { NextFunction, Request, Response } from "express"
import { creatorRepository } from "../repositories/creator.repository.js"
import { searchCreatorProfiles } from "../services/creator-search-index.service.js"
import { creatorService } from "../services/creator.service.js"
import { toCreatorResponse } from "../types/creator.types.js"
import { AppError } from "../../../shared/errors/app-error.js"

export const creatorController = {
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const profile = await creatorService.findBySlug(slug!)

      if (!profile) {
        throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
      }

      res.status(200).json(toCreatorResponse(profile))
    } catch (error) {
      next(error)
    }
  },

  async getSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined
      const genre = typeof req.query.genre === "string" ? req.query.genre : undefined
      const location = typeof req.query.location === "string" ? req.query.location : undefined
      // liveOnly is a discover param with no schema field behind it yet, so
      // it's accepted but intentionally treated as a no-op filter here.
      const profiles = await creatorRepository.search({ q, genre, location })

      res.status(200).json(searchCreatorProfiles(profiles.map(toCreatorResponse), q))
    } catch (error) {
      next(error)
    }
  },
}
