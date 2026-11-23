import { Controller, Get, Patch, Param, Req, Res, Next, UseGuards } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from "../../../shared/database/prisma.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { JwtAuthGuard } from "../../../shared/guards/jwt-auth.guard.js";
import { Roles, RolesGuard } from "../../../shared/guards/roles.guard.js";

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  @Get('audit-log')
  async getAuditLog(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return next(new AppError(501, "NOT_IMPLEMENTED", "Audit log export is not implemented yet"));
    } catch (error) { next(error); }
  }

  @Patch('creators/:id/verify')
  async verifyCreator(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return next(new AppError(501, "NOT_IMPLEMENTED", "Creator verification is not implemented yet"));
    } catch (error) { next(error); }
  }

  @Patch('users/:id/suspend')
  async suspendUser(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return next(new AppError(501, "NOT_IMPLEMENTED", "User suspension is not implemented yet"));
    } catch (error) { next(error); }
  }

  @Patch('payouts/:id/override')
  async overridePayout(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return next(new AppError(501, "NOT_IMPLEMENTED", "Payout override is not implemented yet"));
    } catch (error) { next(error); }
  }

  @Get('dashboard-summary')
  async dashboardSummary(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const [users, creators, activePayouts] = await Promise.all([
        prisma.user.count(),
        prisma.creatorProfile.count(),
        prisma.creatorPayout.count({
          where: { status: { in: ["awaiting_anchor_details", "submitted"] } },
        }),
      ]);
      return res.status(200).json({ users, creators, activePayouts });
    } catch (error) { next(error); }
  }
}
