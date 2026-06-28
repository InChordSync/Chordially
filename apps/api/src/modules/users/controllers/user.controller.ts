import type { NextFunction, Request, Response } from "express"
import { updateMeSchema } from "@chordially/shared"
import { creatorService } from "../../creators/services/creator.service.js"
import { fanService } from "../../fans/services/fan.service.js"
import { toCreatorResponse } from "../../creators/types/creator.types.js"
import { toFanResponse } from "../../fans/types/fan.types.js"
import { userService } from "../services/user.service.js"
import { onboardingService } from "../services/onboarding.service.js"
import { onboardingRepository } from "../repositories/onboarding.repository.js"
import { followService } from "../../follow/services/follow.service.js"
import { bookmarkService } from "../../bookmarks/services/bookmark.service.js"
import { createAvatarUploadUrl } from "../../../shared/storage/s3.js"
import { AppError } from "../../../shared/errors/app-error.js"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const userController = {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!

      const [user, creatorProfile, fanProfile] = await Promise.all([
        userService.findById(userId),
        creatorService.findByUserId(userId),
        fanService.findByUserId(userId),
      ])

      res.status(200).json({
        user: {
          id: userId,
          email: user!.email,
          creatorProfile: creatorProfile ? toCreatorResponse(creatorProfile) : null,
          fanProfile: fanProfile ? toFanResponse(fanProfile) : null,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  async getOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const result = await onboardingService.getOnboarding(userId)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getUploadUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!
      const { contentType, type } = req.body as {
        contentType?: string
        type?: string
      }

      if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
        throw new AppError(
          400,
          "INVALID_CONTENT_TYPE",
          `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(", ")}`
        )
      }

      const assetType = type === "banner" ? "banners" : "avatars"
      const ext = contentType.split("/")[1]
      const key = `${assetType}/${userId}.${ext}`
      const uploadUrl = await createAvatarUploadUrl(key, contentType)
      const publicUrl = `https://${process.env["AWS_S3_BUCKET"]}.s3.amazonaws.com/${key}`

      res.status(200).json({ uploadUrl, publicUrl })
    } catch (error) {
      next(error)
    }
  },

  async getOnboardingResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!
      const result = await onboardingService.getResume(userId)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async markOnboardingStepComplete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!
      const { stepKey } = req.params
      const result = await onboardingService.markComplete(userId, stepKey!)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async patchMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const input = updateMeSchema.parse(req.body)

      const { displayName, avatarUrl, bio, genre, location, genrePrefs } = input

      const [creatorProfile, fanProfile] = await Promise.all([
        creatorService.findByUserId(userId),
        fanService.findByUserId(userId),
      ])

      const creatorFields = { displayName, avatarUrl, bio, genre, location }
      const hasCreatorUpdate = Object.values(creatorFields).some((v) => v !== undefined)

      if (creatorProfile && hasCreatorUpdate) {
        await creatorService.updateCreatorProfile(
          creatorProfile.id,
          creatorFields,
          userId
        )
      }

      const stepCompletions: string[] = []

      if (creatorProfile) {
        if (displayName !== undefined) stepCompletions.push("displayName")
        if (bio !== undefined) stepCompletions.push("bio")
        if (avatarUrl !== undefined) stepCompletions.push("avatarUrl")
        if (genre !== undefined) stepCompletions.push("genre")
        if (location !== undefined) stepCompletions.push("location")
      }

      if (fanProfile) {
        if (displayName !== undefined) stepCompletions.push("displayName")
        if (avatarUrl !== undefined) stepCompletions.push("avatarUrl")
        if (genrePrefs !== undefined) stepCompletions.push("genrePrefs")
      }

      if (stepCompletions.length > 0) {
        await Promise.allSettled(
          stepCompletions.map((stepKey) =>
            onboardingRepository.markCompleted(userId, stepKey)
          )
        )
      }

      if (fanProfile) {
        if (displayName !== undefined) {
          await fanService.updateFanProfile(fanProfile.id, { displayName }, userId)
        }
        if (genrePrefs !== undefined) {
          await fanService.updateGenrePrefs(fanProfile.id, genrePrefs, userId)
        }
      }

      res.status(200).json({ ok: true })
    } catch (error) {
      next(error)
    }
  },

  async getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
      const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20))
      const result = await followService.getFollowing(userId, page, pageSize)
      res.status(200).json(result)
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
