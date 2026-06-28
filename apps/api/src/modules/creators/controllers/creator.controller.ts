import type { NextFunction, Request, Response } from "express"
import { updateTagsSchema, updateAvailabilitySchema } from "@chordially/shared"
import { creatorService } from "../services/creator.service.js"
import { toCreatorResponse, toCreatorCardResponse } from "../types/creator.types.js"
import { creatorRepository } from "../repositories/creator.repository.js"
import { mediaRepository } from "../../media/repositories/media.repository.js"
import { followRepository } from "../../follow/repositories/follow.repository.js"
import { followService } from "../../follow/services/follow.service.js"
import { bookmarkRepository } from "../../bookmarks/repositories/bookmark.repository.js"
import { AppError } from "../../../shared/errors/app-error.js"

export const creatorController = {
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const profile = await creatorService.findBySlug(slug!)

      if (!profile) {
        throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
      }

      const cover = await mediaRepository.findCoverByCreatorId(profile.id)
      const coverUrl = cover?.url ?? null
      res.status(200).json(toCreatorResponse(profile, coverUrl))
    } catch (error) {
      next(error)
    }
  },

  async patchMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { displayName, bio, genre, location, avatarUrl, bannerUrl, tags } = req.body as Record<string, unknown>

      const profile = await creatorService.findByUserId(userId)
      if (!profile) {
        throw new AppError(404, "CREATOR_PROFILE_REQUIRED", "Create a creator profile first")
      }

      const input: Record<string, unknown> = {}
      if (displayName !== undefined) input.displayName = displayName
      if (bio !== undefined) input.bio = bio
      if (genre !== undefined) input.genre = genre
      if (location !== undefined) input.location = location
      if (avatarUrl !== undefined) input.avatarUrl = avatarUrl
      if (bannerUrl !== undefined) input.bannerUrl = bannerUrl
      if (tags !== undefined) input.tags = tags

      const updated = await creatorService.updateCreatorProfile(profile.id, input, userId)
      res.status(200).json(toCreatorResponse(updated))
    } catch (error) {
      next(error)
    }
  },

  async updateTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { tags } = updateTagsSchema.parse(req.body)

      const profile = await creatorService.findByUserId(userId)
      if (!profile) {
        throw new AppError(404, "CREATOR_PROFILE_REQUIRED", "Create a creator profile first")
      }

      const updated = await creatorService.updateTags(profile.id, tags, userId)
      res.status(200).json(toCreatorResponse(updated))
    } catch (error) {
      next(error)
    }
  },

  async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { availability } = updateAvailabilitySchema.parse(req.body)

      const profile = await creatorService.findByUserId(userId)
      if (!profile) {
        throw new AppError(404, "CREATOR_PROFILE_REQUIRED", "Create a creator profile first")
      }

      const updated = await creatorService.updateAvailability(
        profile.id,
        availability,
        userId
      )
      res.status(200).json(toCreatorResponse(updated))
    } catch (error) {
      next(error)
    }
  },

  async activityPing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!

      const profile = await creatorService.findByUserId(userId)
      if (!profile) {
        throw new AppError(404, "CREATOR_PROFILE_REQUIRED", "Create a creator profile first")
      }

      const updated = await creatorService.activityPing(profile.id, userId)
      res.status(200).json(toCreatorResponse(updated))
    } catch (error) {
      next(error)
    }
  },

  async getCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const profile = await creatorService.findBySlug(slug!)

      if (!profile) {
        throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
      }

      const [followerCount, bookmarkCount] = await Promise.all([
        creatorRepository.getFollowerCount(profile.id),
        creatorRepository.getBookmarkCount(profile.id),
      ])

      let isFollowing: boolean | undefined
      let isBookmarked: boolean | undefined

      if (req.userId) {
        const [follow, bookmark] = await Promise.all([
          followRepository.findByFollowerAndFollowing(req.userId, profile.userId),
          bookmarkRepository.findByUserAndCreator(req.userId, profile.id),
        ])
        isFollowing = follow !== null
        isBookmarked = bookmark !== null
      }

      res.status(200).json(toCreatorCardResponse(profile, followerCount, isFollowing, isBookmarked))
    } catch (error) {
      next(error)
    }
  },

  async getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
      const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20))

      const result = await followService.getFollowers(slug!, page, pageSize)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getFollowCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params

      const result = await followService.getFollowCount(slug!)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const profile = await creatorService.findBySlug(slug!)

      if (!profile) {
        throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
      }

      res.status(200).json(profile.availability)
    } catch (error) {
      next(error)
    }
  },
}
