export type LinkStepState = 'idle' | 'generating_challenge' | 'awaiting_signature' | 'linked' | 'error';

export interface WalletInitiationFormData {
  publicAddress: string;
  network: 'mainnet' | 'testnet';
}

export interface ChallengeResponsePayload {
  challengeId: string;
  nonce: string;
  signMessage: string;
  expiresAtIso: string;
}
