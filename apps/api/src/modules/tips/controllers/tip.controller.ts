
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
import { createTipSchema, type CreateTipRequest } from "../validators/tip.validators.js";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe.js";

interface AuthenticatedRequest extends Request {
  userId: string;
}

@Controller("tips")
export class TipController {
  constructor() {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendTip(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createTipSchema)) input: CreateTipRequest,
  ) {
    return tipService.submitTip({
      ...input,
      fanUserId: req.userId,
    });
  }
}
