import { Controller, Get, Post, Body, Param, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from "../../../shared/errors/app-error.js";
import { depositService } from "../services/deposit.service.js";
import { createDepositSchema } from "../validators/deposit.validators.js";

type AuthenticatedRequest = Request & { userId?: string };

function requestUserId(req: Request): string {
  const userId = (req as AuthenticatedRequest).userId;
  if (typeof userId !== "string" || userId.length === 0) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return userId;
}

function positiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

/**
 * Typed replacement for the old Express adapter: the deposit service is the
 * single source of truth for initiating, listing and refreshing deposits.
 */
@Controller('wallet/deposits')
export class DepositController {
  @Post()
  async create(@Req() req: Request, @Body() body: unknown, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      const input = createDepositSchema.parse(body);
      const deposit = await depositService.initiateDeposit(
        userId,
        input.assetCode,
        input.idempotencyKey
      );
      return res.status(201).json(deposit);
    } catch (error) { next(error); }
  }

  @Get()
  async list(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      const page = positiveInt(req.query.page, 1);
      const pageSize = positiveInt(req.query.pageSize, 20);
      return res.status(200).json(
        await depositService.listDepositsForUser(userId, page, pageSize)
      );
    } catch (error) { next(error); }
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = requestUserId(req);
      return res.status(200).json(
        await depositService.refreshDepositStatus(userId, id)
      );
    } catch (error) { next(error); }
  }
}
