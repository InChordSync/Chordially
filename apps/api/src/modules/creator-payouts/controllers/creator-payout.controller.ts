import { Controller, Get, Post, Param, Body, Req, Res, Next, UseGuards } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { requestUserId } from "../../../shared/middleware/request-user-id.js";
import { creatorPayoutService } from "../services/creator-payout.service.js";
import { checkEligibilitySchema, createCreatorPayoutSchema } from "../validators/creator-payout.validators.js";
import type { CheckEligibilityRequest, CreateCreatorPayoutRequest } from "../validators/creator-payout.validators.js";
import { WebhookProvider, WebhookVerificationGuard } from "../../../shared/guards/webhook-verification.guard.js";
import { Public } from "../../../shared/decorators/public.decorator.js";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe.js";

@Controller('creator-payouts')
export class CreatorPayoutController {
  @Post()
  async create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createCreatorPayoutSchema)) input: CreateCreatorPayoutRequest,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const userId = req.userId!;
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
  @Public()
  @UseGuards(WebhookVerificationGuard)
  @WebhookProvider('creator-payout')
  async handleWebhook(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-074 anchor webhook placeholder
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Post('eligibility')
  async checkEligibility(
    @Req() req: Request,
    @Body(new ZodValidationPipe(checkEligibilitySchema)) input: CheckEligibilityRequest,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const { amount, assetCode } = input;
      const result = await creatorPayoutService.checkEligibility(
        req.userId!,
        amount,
        assetCode
      );
      return res.status(200).json(result);
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
      const userId = req.userId!;
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
      const userId = req.userId!;
      const payout = await creatorPayoutService.refreshPayoutStatus(userId, id);
      return res.status(200).json(payout);
    } catch (error) { next(error); }
  }
}
