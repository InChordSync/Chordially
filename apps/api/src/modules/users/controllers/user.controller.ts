import { Controller, Get, Patch, Post, Body, Req, Res, Next, Param } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { updateMeSchema } from "@chordially/shared";
import { computeCreatorCompleteness, computeFanCompleteness } from "@chordially/shared";
import { creatorService } from "../../creators/services/creator.service.js";
import { fanService } from "../../fans/services/fan.service.js";
import { toCreatorResponse } from "../../creators/types/creator.types.js";
import { toFanResponse } from "../../fans/types/fan.types.js";
import { userService } from "../services/user.service.js";
import { ImageContentTypePipe } from "../../../shared/pipes/image-content-type.pipe.js";
import { FileService } from "../../../shared/storage/file.service.js";

@Controller('users')
export class UserController {
  constructor(private fileService: FileService) {}

  @Get('me')
  async getMe(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const [user, creatorProfile, fanProfile] = await Promise.all([
        userService.findById(userId),
        creatorService.findByUserId(userId),
        fanService.findByUserId(userId),
      ]);
      return res.status(200).json({
        user: {
          id: userId,
          email: user!.email,
          creatorProfile: creatorProfile ? toCreatorResponse(creatorProfile) : null,
          fanProfile: fanProfile ? toFanResponse(fanProfile) : null,
        },
      });
    } catch (error) { next(error); }
  }

  @Get('me/completeness')
  async getCompleteness(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
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
      const userId = (req as any).userId!;
      const ext = contentType.split("/")[1];
      const key = `avatars/${userId}.${ext}`;
      
      const creatorProfile = await creatorService.findByUserId(userId);
      if (creatorProfile?.avatarUrl) {
        const oldKey = creatorProfile.avatarUrl.split('.com/')[1];
        if (oldKey) await this.fileService.deleteAvatar(oldKey);
      }

      const uploadUrl = await this.fileService.getAvatarUploadUrl(key, contentType);
      const avatarUrl = `https://${process.env["AWS_S3_BUCKET"]}.s3.amazonaws.com/${key}`;
      return res.status(200).json({ uploadUrl, avatarUrl });
    } catch (error) { next(error); }
  }

  @Get('me/avatar-signed-url')
  async getSignedUrl(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const creatorProfile = await creatorService.findByUserId(userId);
      if (!creatorProfile?.avatarUrl) return res.status(404).json({ error: "Not found" });
      const key = creatorProfile.avatarUrl.split('.com/')[1];
      const signedUrl = await this.fileService.getSignedGetUrl(key!);
      return res.status(200).json({ signedUrl });
    } catch (error) { next(error); }
  }

  @Patch('me')
  async patchMe(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const input = updateMeSchema.parse(body);
      const { displayName, avatarUrl, bio, genre, location, genrePrefs } = input;
      const [creatorProfile, fanProfile] = await Promise.all([
        creatorService.findByUserId(userId),
        fanService.findByUserId(userId),
      ]);
      const creatorFields = { displayName, avatarUrl, bio, genre, location };
      const hasCreatorUpdate = Object.values(creatorFields).some((v) => v !== undefined);
      if (creatorProfile && hasCreatorUpdate) {
        await creatorService.updateCreatorProfile(creatorProfile.id, creatorFields, userId);
      }
      if (fanProfile) {
        if (displayName !== undefined) {
          await fanService.updateFanProfile(fanProfile.id, { displayName }, userId);
        }
        if (genrePrefs !== undefined) {
          await fanService.updateGenrePrefs(fanProfile.id, genrePrefs, userId);
        }
      }
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }
}
