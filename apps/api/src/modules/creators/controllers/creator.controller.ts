import { Controller, Get, Post, Patch, Param, Body, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { creatorService } from "../services/creator.service.js";
import { toCreatorResponse } from "../types/creator.types.js";
import { createCreatorProfileSchema, updateCreatorProfileSchema } from "../validators/creator.validators.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { CreateCreatorProfileRequest, UpdateCreatorProfileRequest } from "../validators/creator.validators.js";
import { Public } from "../../../shared/decorators/public.decorator.js";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe.js";

@Controller('creators')
export class CreatorController {
  @Post()
  async create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createCreatorProfileSchema)) input: CreateCreatorProfileRequest,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const userId = req.userId!;
      const profile = await creatorService.createCreatorProfile({ userId, ...input });
      return res.status(201).json(toCreatorResponse(profile));
    } catch (error) { next(error); }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body(new ZodValidationPipe(updateCreatorProfileSchema)) input: UpdateCreatorProfileRequest,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const userId = req.userId!;
      const profile = await creatorService.updateCreatorProfile(id, input, userId);
      return res.status(200).json(toCreatorResponse(profile));
    } catch (error) { next(error); }
  }

  @Get(':slug')
  @Public()
  async getBySlug(@Param('slug') slug: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const profile = await creatorService.findBySlug(slug);
      if (!profile) {
        throw new AppError(404, "CREATOR_NOT_FOUND", `Creator '${slug}' was not found`);
      }
      return res.status(200).json(toCreatorResponse(profile));
    } catch (error) { next(error); }
  }
}
