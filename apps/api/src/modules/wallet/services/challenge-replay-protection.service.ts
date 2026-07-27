import {
  challengeValidationResultSchema,
  type ChallengeValidationResult,
} from '@chordially/shared';

export class ChallengeReplayProtectionService {
  private readonly usedNonces: Set<string> = new Set();

  public validateAndConsumeNonce(nonce: string): ChallengeValidationResult {
    const now = new Date().toISOString();
    if (this.usedNonces.has(nonce)) {
      return challengeValidationResultSchema.parse({
        isValid: false,
        reason: 'already_used',
        validatedAt: now,
      });
    }

    this.usedNonces.add(nonce);
    return challengeValidationResultSchema.parse({
      isValid: true,
      validatedAt: now,
    });
  }
}
