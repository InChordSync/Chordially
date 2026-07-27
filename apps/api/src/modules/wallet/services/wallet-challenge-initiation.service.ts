import {
  challengeResponsePayloadSchema,
  walletInitiationFormDataSchema,
  type ChallengeResponsePayload,
  type WalletInitiationFormDataInput,
} from '@chordially/shared';

export class WalletChallengeInitiationService {
  public async initiateChallenge(formData: WalletInitiationFormDataInput): Promise<ChallengeResponsePayload> {
    const validated = walletInitiationFormDataSchema.parse(formData);
    const nonce = Math.random().toString(36).substring(2, 12);
    const payload: ChallengeResponsePayload = {
      challengeId: `ch_${Date.now()}`,
      nonce,
      signMessage: `Please sign this nonce to verify wallet ownership: ${nonce}`,
      expiresAtIso: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
    return challengeResponsePayloadSchema.parse(payload);
  }
}
