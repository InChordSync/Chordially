import { Controller, Post, Get, Put, Param, Body, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { requestUserId } from "../../../shared/middleware/request-user-id.js";
import { tipService } from "../services/tip.service.js";
import { toTipResponse } from "../types/tip.types.js";

@Controller('tips')
export class TipController {
  @Post()
  async sendTip(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const fanUserId = requestUserId(req);
      const { creatorId, streamId, amount, token } = body;
      const tip = await tipService.sendTip(fanUserId, creatorId, amount, token, streamId);
      return res.status(201).json(toTipResponse(tip));
    } catch (error) { next(error); }
  }
}
