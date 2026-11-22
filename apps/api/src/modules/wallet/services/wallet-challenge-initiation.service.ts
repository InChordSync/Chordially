import {
  challengeResponsePayloadSchema,
  walletInitiationFormDataSchema,
  type ChallengeResponsePayload,
  type WalletInitiationFormDataInput,
} from '@chordially/shared';
import { walletAuditLogger } from './wallet-audit-logger.service.js';

export class WalletChallengeInitiationService {
  public async initiateChallenge(formData: WalletInitiationFormDataInput): Promise<ChallengeResponsePayload> {
    const validated = walletInitiationFormDataSchema.parse(formData);
    const nonce = Math.random().toString(36).substring(2, 12);
    const challengeId = `ch_${Date.now()}`;
    const payload: ChallengeResponsePayload = {
      challengeId,
      nonce,
      signMessage: `Please sign this nonce to verify wallet ownership: ${nonce}`,
      expiresAtIso: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    walletAuditLogger.logWalletEvent(challengeId, validated.publicAddress, 'challenge_issued');

    return challengeResponsePayloadSchema.parse(payload);
  }
}
