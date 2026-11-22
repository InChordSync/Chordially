import { Controller, Get, Patch, Param, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Controller('notifications')
export class NotificationController {
  @Get()
  async list(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ items: [], unreadCount: 0 });
    } catch (error) { next(error); }
  }

  @Patch('read-all')
  async readAll(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-082
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Patch(':id/read')
  async readOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-082
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Get('email-provider')
  async getEmailProvider(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-083 Email notification provider
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }
}
