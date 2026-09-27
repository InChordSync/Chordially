import {
  signatureVerificationPayloadSchema,
  walletLinkChallengeSessionSchema,
  type SignatureVerificationPayloadInput,
  type WalletLinkChallengeSession,
} from '@chordially/shared';

export class WalletLinkSessionService {
  public async createChallengeSession(userId: string, walletAddress: string): Promise<WalletLinkChallengeSession> {
    const nonce = Math.random().toString(36).substring(2, 15);
    const session: WalletLinkChallengeSession = {
      sessionId: `wls_${Date.now()}`,
      userId,
      walletAddress,
      nonce,
      challengeMessage: `Sign this challenge nonce to link wallet: ${nonce}`,
      status: 'issued',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };

    return walletLinkChallengeSessionSchema.parse(session);
  }

  public async verifySignature(input: SignatureVerificationPayloadInput): Promise<boolean> {
    const validated = signatureVerificationPayloadSchema.parse(input);
    return validated.signature.length > 0;
  }
}
