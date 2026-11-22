import { Controller, Get, Patch, Param, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Controller('admin')
export class AdminController {
  @Get('audit-log')
  async getAuditLog(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ logs: [] });
    } catch (error) { next(error); }
  }

  @Patch('creators/:id/verify')
  async verifyCreator(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Patch('users/:id/suspend')
  async suspendUser(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-094
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Patch('payouts/:id/override')
  async overridePayout(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-095
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Get('dashboard-summary')
  async dashboardSummary(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-096
      return res.status(200).json({ users: 0, creators: 0, activePayouts: 0 });
    } catch (error) { next(error); }
  }
}
