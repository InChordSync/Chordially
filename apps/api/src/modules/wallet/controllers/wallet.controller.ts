import { Controller, Get, Post, Patch, Delete, Param, Body, Req, Res, Next } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response, NextFunction } from 'express';
import { walletService } from "../services/wallet.service.js";

@Controller('wallet')
export class WalletController {
  @Post('link-challenge')
  @Throttle({ default: { limit: 5, ttl: 60 } }) // N-062
  async getLinkChallenge(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const { publicKey } = body;
      const challenge = await walletService.generateLinkChallenge(publicKey);
      return res.status(200).json(challenge);
    } catch (error) { next(error); }
  }

  @Post('link-verify')
  async verifyChallenge(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Get('me')
  async getMe(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const wallet = await walletService.getPrimaryWallet(userId);
      return res.status(200).json({ wallet });
    } catch (error) { next(error); }
  }

  @Post('usdc-trustline')
  async establishUsdcTrustline(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const userId = (req as any).userId!;
      const result = await walletService.establishUsdcTrustline(userId);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  @Get()
  async getWallets(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ wallets: [] });
    } catch (error) { next(error); }
  }

  @Delete(':id')
  async unlinkWallet(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Patch(':id/primary')
  async setPrimaryWallet(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }

  @Post('integrate-stellar')
  async integrateStellar(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      return res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  }
}
