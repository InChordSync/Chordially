import { Controller, Get, Post, Param, Body, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { requestUserId } from "../../../shared/middleware/request-user-id.js";
import { creatorPayoutService } from "../services/creator-payout.service.js";
import { createCreatorPayoutSchema } from "../validators/creator-payout.validators.js";

@Controller('creator-payouts')
export class CreatorPayoutController {
  @Post()
  async create(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      const input = createCreatorPayoutSchema.parse(body);
      const payout = await creatorPayoutService.initiatePayout(
        userId,
        input.amount,
        input.assetCode,
        input.idempotencyKey
      );
      // N-077 idempotency implemented inside service
      return res.status(201).json(payout);
    } catch (error) { next(error); }
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-074 anchor webhook placeholder
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Post('eligibility')
  async checkEligibility(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ eligible: true });
    } catch (error) { next(error); }
  }

  @Post('interactive-withdrawal')
  async interactiveWithdrawal(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ url: "https://anchor.com/withdraw" });
    } catch (error) { next(error); }
  }

  @Get()
  async list(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      const payouts = await creatorPayoutService.listPayoutsForCreator(userId);
      // N-075 payout history list
      return res.status(200).json(payouts);
    } catch (error) { next(error); }
  }

  @Get('audit-log')
  async getAuditLog(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-076 payout audit log
      return res.status(200).json({ logs: [] });
    } catch (error) { next(error); }
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      const payout = await creatorPayoutService.refreshPayoutStatus(userId, id);
      return res.status(200).json(payout);
    } catch (error) { next(error); }
  }
}
