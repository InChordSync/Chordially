import { Controller, Get, Post, Patch, Param, Body, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { creatorService } from "../services/creator.service.js";
import { toCreatorResponse } from "../types/creator.types.js";
import { createCreatorProfileSchema, updateCreatorProfileSchema } from "../validators/creator.validators.js";

@Controller('creators')
export class CreatorController {
  @Post()
  async create(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const input = createCreatorProfileSchema.parse(body);
      const profile = await creatorService.createCreatorProfile(userId, input);
      return res.status(201).json(toCreatorResponse(profile));
    } catch (error) {
      next(error);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const input = updateCreatorProfileSchema.parse(body);
      const profile = await creatorService.updateCreatorProfile(id, input, userId);
      return res.status(200).json(toCreatorResponse(profile));
    } catch (error) {
      next(error);
    }
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const profile = await creatorService.findBySlug(slug);
      return res.status(200).json(profile ? toCreatorResponse(profile) : null);
    } catch (error) {
      next(error);
    }
  }
}
