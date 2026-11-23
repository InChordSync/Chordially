import { Controller, Get, Patch, Post, Body, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { updateMeSchema } from "@chordially/shared";
import { computeCreatorCompleteness, computeFanCompleteness } from "@chordially/shared";
import { prisma } from "../../../shared/database/prisma.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { logger } from "../../../shared/logger/logger.js";
import { requestUserId } from "../../../shared/middleware/request-user-id.js";
import { ImageContentTypePipe } from "../../../shared/pipes/image-content-type.pipe.js";
import { FileService } from "../../../shared/storage/file.service.js";
import { creatorService } from "../../creators/services/creator.service.js";
import { toCreatorResponse } from "../../creators/types/creator.types.js";
import { fanService } from "../../fans/services/fan.service.js";
import { toFanResponse } from "../../fans/types/fan.types.js";
import { avatarKeyFromUrl, createAvatarKey, verifyAvatarForUser } from "../services/avatar.service.js";
import { userService } from "../services/user.service.js";


function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Controller('users')
export class UserController {
  constructor(private fileService: FileService) {}

  private async requireExistingUser(userId: string) {
    const user = await userService.findById(userId);
    if (!user) {
      // The token is still valid but the account is gone — never treat it as
      // an anonymous or partially authenticated request.
      throw new AppError(401, "UNAUTHORIZED", "Account no longer exists");
    }
    return user;
  }

  @Get('me')
  async getMe(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      const user = await this.requireExistingUser(userId);
      const [creatorProfile, fanProfile] = await Promise.all([
        creatorService.findByUserId(userId),
        fanService.findByUserId(userId),
      ]);
      return res.status(200).json({
        user: {
          id: userId,
          email: user.email,
          creatorProfile: creatorProfile ? toCreatorResponse(creatorProfile) : null,
          fanProfile: fanProfile ? toFanResponse(fanProfile) : null,
        },
      });
    } catch (error) { next(error); }
  }

  @Get('me/completeness')
  async getCompleteness(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      await this.requireExistingUser(userId);
      const [creatorProfile, fanProfile] = await Promise.all([
        creatorService.findByUserId(userId),
        fanService.findByUserId(userId),
      ]);
      const scores: number[] = [];
      const missing: string[] = [];
      if (creatorProfile) {
        const result = computeCreatorCompleteness({
          ...toCreatorResponse(creatorProfile),
          followerCount: 0,
          trackCount: 0,
        });
        scores.push(result.score);
        missing.push(...result.missingFields);
      }
      if (fanProfile) {
        const result = computeFanCompleteness(toFanResponse(fanProfile));
        scores.push(result.score);
        missing.push(...result.missingFields);
      }
      if (scores.length === 0) {
        return res.status(200).json({ score: 0, missingFields: [] });
      }
      const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
      const missingFields = [...new Set(missing)];
      return res.status(200).json({ score, missingFields });
    } catch (error) { next(error); }
  }

  @Post('me/avatar-upload-url')
  async getAvatarUploadUrl(@Req() req: Request, @Body('contentType', ImageContentTypePipe) contentType: string, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      await this.requireExistingUser(userId);
      const key = createAvatarKey(userId, contentType);

      // The old object stays in place until the client PUT succeeds AND the
      // PATCH that confirms the new URL commits. Deleting here would leave the
      // profile pointing at a missing object if either step failed.
      const uploadUrl = await this.fileService.getAvatarUploadUrl(key, contentType);
      const avatarUrl = `https://${process.env["AWS_S3_BUCKET"]}.s3.amazonaws.com/${key}`;
      return res.status(200).json({ uploadUrl, avatarUrl });
    } catch (error) { next(error); }
  }

  @Get('me/avatar-signed-url')
  async getSignedUrl(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      await this.requireExistingUser(userId);
      const creatorProfile = await creatorService.findByUserId(userId);
      if (!creatorProfile?.avatarUrl) return res.status(404).json({ error: "Not found" });
      const key = avatarKeyFromUrl(creatorProfile.avatarUrl);
      if (!key) {
        throw new AppError(400, "INVALID_AVATAR_URL", "Stored avatar URL is invalid");
      }
      const signedUrl = await this.fileService.getSignedGetUrl(key);
      return res.status(200).json({ signedUrl });
    } catch (error) { next(error); }
  }

  @Patch('me')
  async patchMe(@Req() req: Request, @Body() body: unknown, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      const user = await this.requireExistingUser(userId);
      const input = updateMeSchema.parse(body);
      const { displayName, avatarUrl, bio, genre, location, genrePrefs } = input;

      // Verify the uploaded object before committing any profile changes.
      const newAvatarKey = avatarUrl ? await verifyAvatarForUser(userId, avatarUrl) : null;

      const { oldAvatarKey, creatorProfile, fanProfile } = await prisma.$transaction(async (tx) => {
        const [currentCreator, currentFan] = await Promise.all([
          creatorService.findByUserId(userId, tx),
          fanService.findByUserId(userId, tx),
        ]);

        const previousAvatarKey = avatarUrl !== undefined && currentCreator?.avatarUrl
          ? avatarKeyFromUrl(currentCreator.avatarUrl)
          : null;

        const creatorFields = { displayName, avatarUrl, bio, genre, location };
        const hasCreatorUpdate = Object.values(creatorFields).some((v) => v !== undefined);
        let updatedCreator = currentCreator;
        if (currentCreator && hasCreatorUpdate) {
          updatedCreator = await creatorService.updateCreatorProfile(
            currentCreator.id,
            // updateMeSchema allows `null` to clear optional fields; the
            // creator input type has not caught up with that yet.
            creatorFields as Parameters<typeof creatorService.updateCreatorProfile>[1],
            userId,
            tx
          );
        }

        let updatedFan = currentFan;
        if (currentFan) {
          if (displayName !== undefined) {
            updatedFan = await fanService.updateFanProfile(
              currentFan.id, { displayName }, userId, tx
            );
          }
          if (genrePrefs !== undefined) {
            updatedFan = await fanService.updateGenrePrefs(
              currentFan.id, genrePrefs, userId, tx
            );
          }
        }

        return {
          oldAvatarKey: previousAvatarKey,
          creatorProfile: updatedCreator ? toCreatorResponse(updatedCreator) : null,
          fanProfile: updatedFan ? toFanResponse(updatedFan) : null,
        };
      });

      // Only now that the new URL is durable is the previous object disposable.
      // Cleanup is best-effort: a storage failure must not fail the update.
      if (avatarUrl !== undefined && oldAvatarKey && oldAvatarKey !== newAvatarKey) {
        try {
          await this.fileService.deleteAvatar(oldAvatarKey);
        } catch (error) {
          logger.error("Failed to delete previous avatar after profile update", {
            userId,
            key: oldAvatarKey,
            error: describeError(error),
          });
        }
      }

      return res.status(200).json({
        ok: true,
        user: {
          id: userId,
          email: user.email,
          creatorProfile,
          fanProfile,
        },
        creatorProfile,
        fanProfile,
      });
    } catch (error) { next(error); }
  }
}
