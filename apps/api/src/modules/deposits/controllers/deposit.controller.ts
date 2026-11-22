import { Controller, Get, Post, Param, Query, Body, Req, Res, Next, UseGuards } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { depositService } from "../../wallet/services/deposit.service.js";
import { createDepositSchema } from "../../wallet/validators/deposit.validators.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { WebhookProvider, WebhookVerificationGuard } from "../../../shared/guards/webhook-verification.guard.js";

function currentUserId(req: Request): string {
  const userId = (req as any).userId;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return userId;
}

@Controller('deposits')
export class DepositController {
  @Get()
  async getDeposits(
    @Query('page') page: string | undefined,
    @Query('pageSize') pageSize: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    try {
      const deposits = await depositService.listDepositsForUser(
        currentUserId(req),
        page === undefined ? 1 : Number(page),
        pageSize === undefined ? 20 : Number(pageSize)
      );
      return res.status(200).json(deposits);
    } catch (error) { next(error); }
  }

  @Post('webhook')
  @UseGuards(WebhookVerificationGuard)
  @WebhookProvider('deposit')
  async anchorWebhook(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Get(['status-poll', 'status-poll/:depositId'])
  async pollStatus(
    @Param('depositId') depositIdParam: string | undefined,
    @Query('depositId') depositIdQuery: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    try {
      const depositId = depositIdParam ?? depositIdQuery;
      if (!depositId) {
        throw new AppError(400, "VALIDATION_ERROR", "depositId is required");
      }
      const deposit = await depositService.refreshDepositStatus(currentUserId(req), depositId);
      return res.status(200).json(deposit);
    } catch (error) { next(error); }
  }

  @Post('interactive')
  async interactiveDeposit(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const { assetCode, idempotencyKey } = createDepositSchema.parse(body ?? {});
      const deposit = await depositService.initiateDeposit(
        currentUserId(req),
        assetCode,
        idempotencyKey
      );
      return res.status(201).json(deposit);
    } catch (error) { next(error); }
  }
}
