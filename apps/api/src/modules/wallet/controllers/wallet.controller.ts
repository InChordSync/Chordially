import { Controller, Get, Post, Patch, Delete, Param, Body, Req, Res, Next } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response, NextFunction } from 'express';
import { walletService } from "../services/wallet.service.js";
import { walletAuditLogger } from "../services/wallet-audit-logger.service.js";
import { issueWalletLinkChallenge, verifyWalletLinkChallenge } from "../../../shared/wallet-link/challenge.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { linkChallengeSchema, verifyWalletLinkSchema } from "../validators/wallet.validators.js";

function currentUserId(req: Request): string {
  const userId = (req as any).userId;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  return userId;
}

@Controller('wallet')
export class WalletController {
  @Post('link-challenge')
  @Throttle({ default: { limit: 5, ttl: 60 } }) // N-062
  async getLinkChallenge(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const { publicKey } = linkChallengeSchema.parse(body ?? {});
      return res.status(200).json(issueWalletLinkChallenge(publicKey));
    } catch (error) { next(error); }
  }

  @Post('link-verify')
  async verifyChallenge(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const { publicKey, challenge, signature } = verifyWalletLinkSchema.parse(body ?? {});

      if (!verifyWalletLinkChallenge(challenge, publicKey, signature)) {
        walletAuditLogger.logWalletEvent("wallet-link-verify", publicKey, "challenge_failed");
        throw new AppError(401, "INVALID_SIGNATURE", "Could not verify control of this Stellar account");
      }

      const wallet = await walletService.linkWallet(
        currentUserId(req),
        publicKey,
        challenge,
        signature
      );
      return res.status(201).json(wallet);
    } catch (error) { next(error); }
  }

  @Get('me')
  async getMe(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const wallet = await walletService.getWalletForUser(currentUserId(req));
      return res.status(200).json(wallet);
    } catch (error) { next(error); }
  }

  @Post('usdc-trustline')
  async establishUsdcTrustline(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const result = await walletService.establishUsdcTrustline(currentUserId(req));
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }

  // The data model has one wallet per user (Wallet.userId is @unique and
  // User.wallet is singular). These multi-wallet operations were previously
  // advertised as supported while returning ok:true without doing anything.
  // Keep the routes explicit about being unavailable rather than lying to
  // clients; they can be implemented behind a schema migration later.
  @Get()
  async getWallets(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return next(new AppError(501, "NOT_IMPLEMENTED", "Multiple wallets are not supported for this account"));
  }

  @Delete(':id')
  async unlinkWallet(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return next(new AppError(501, "NOT_IMPLEMENTED", "Wallet unlinking is not implemented"));
  }

  @Patch(':id/primary')
  async setPrimaryWallet(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return next(new AppError(501, "NOT_IMPLEMENTED", "A single-wallet account has no primary wallet to set"));
  }

  @Post('integrate-stellar')
  async integrateStellar(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return next(new AppError(501, "NOT_IMPLEMENTED", "Stellar integration is already handled at registration"));
  }
}
