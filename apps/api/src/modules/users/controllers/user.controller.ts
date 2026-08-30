import type { NextFunction, Request, Response } from "express"
import { updateMeSchema } from "@chordially/shared"
import { creatorService } from "../../creators/services/creator.service.js"
import { fanService } from "../../fans/services/fan.service.js"
import { toCreatorResponse } from "../../creators/types/creator.types.js"
import { toFanResponse } from "../../fans/types/fan.types.js"
import { userService } from "../services/user.service.js"
import { createAvatarUploadUrl } from "../../../shared/storage/s3.js"
import { verifyAvatarUrl } from "../../creators/services/avatar-moderation.service.js"
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

  async getAvatarUploadUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!
      const { contentType } = req.body as { contentType?: string }

      if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
        throw new AppError(
          400,
          "INVALID_CONTENT_TYPE",
          `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(", ")}`
        )
      }

      const ext = contentType.split("/")[1]
      const key = `avatars/${userId}.${ext}`
      const uploadUrl = await createAvatarUploadUrl(key, contentType)
      const avatarUrl = `https://${process.env["AWS_S3_BUCKET"]}.s3.amazonaws.com/${key}`

      res.status(200).json({ uploadUrl, avatarUrl })
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

      // Post-upload verification: before the avatar is marked active, fetch
      // the stored object and confirm its real size/type/magic bytes via the
      // moderation service (the presigned-URL flow only ever saw the client's
      // declared content type).
      if (creatorProfile && avatarUrl !== undefined) {
        await verifyAvatarUrl(creatorProfile.userId, avatarUrl)
      }

      const hasCreatorUpdate = Object.values(creatorFields).some((v) => v !== undefined)

      if (creatorProfile && hasCreatorUpdate) {
        await creatorService.updateCreatorProfile(
          creatorProfile.id,
          creatorFields,
          userId
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
}
