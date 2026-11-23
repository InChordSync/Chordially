
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";

import type { Request } from "express";

import { tipService } from "../services/tip.service.js";
import { toTipResponse } from "../types/tip.types.js";

interface AuthenticatedRequest extends Request {
  userId: string;
}

interface SendTipDto {
  creatorId: string;
  streamId?: string;
  amount: number;
  token: string;
}

@Controller("tips")
export class TipController {
  constructor() {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendTip(
    @Req() req: AuthenticatedRequest,
    @Body() body: SendTipDto,
  ) {
    const { creatorId, streamId, amount, token } = body;

    const tip = await tipService.sendTip(
      req.userId,
      creatorId,
      amount,
      token,
      streamId,
    );

    return toTipResponse(tip);
  }
}
