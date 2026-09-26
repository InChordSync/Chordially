import { Controller, Post, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { reconciliationService } from "../services/reconciliation.service.js";

@Controller('reconciliation')
export class ReconciliationController {
  @Post('run')
  async run(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const summary = await reconciliationService.run();
      return res.status(200).json(summary);
    } catch (error) { next(error); }
  }
}
