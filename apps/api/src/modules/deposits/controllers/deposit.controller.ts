import { Controller, Get, Post, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Controller('deposits')
export class DepositController {
  @Get()
  async getDeposits(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ deposits: [] });
    } catch (error) { next(error); }
  }

  @Post('webhook')
  async anchorWebhook(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Get('status-poll')
  async pollStatus(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ status: "completed" });
    } catch (error) { next(error); }
  }

  @Post('interactive')
  async interactiveDeposit(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      // N-065
      return res.status(200).json({ url: "https://anchor.com/deposit" });
    } catch (error) { next(error); }
  }
}
