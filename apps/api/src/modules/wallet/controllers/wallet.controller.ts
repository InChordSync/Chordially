import { Controller, Get, Post, Delete, Patch, Param, Body, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from "../../../shared/errors/app-error.js";
import { walletService } from "../services/wallet.service.js";

@Controller('wallet')
export class WalletController {
  @Post('link-challenge')
  async getLinkChallenge(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const { publicKey } = body;
      const challenge = await walletService.generateLinkChallenge(publicKey);
      return res.status(200).json(challenge);
    } catch (error) {
      next(error);
    }
  }

  @Get('me')
  async getMe(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const wallet = await walletService.getPrimaryWallet(userId);
      return res.status(200).json({ wallet });
    } catch (error) {
      next(error);
    }
  }

  @Post('usdc-trustline')
  async establishUsdcTrustline(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const result = await walletService.establishUsdcTrustline(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
