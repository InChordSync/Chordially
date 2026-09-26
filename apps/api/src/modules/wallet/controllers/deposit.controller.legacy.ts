import { Controller, Post, Get, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { depositController } from './deposit.controller.express.js';

@Controller('wallet/deposits')
export class DepositControllerLegacy {
  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return depositController.create(req, res, next);
  }

  @Get()
  async getStatus(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return depositController.getStatus(req, res, next);
  }
}
