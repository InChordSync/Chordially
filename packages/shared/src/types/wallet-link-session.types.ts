export type WalletChallengeStatus = 'issued' | 'verified' | 'expired' | 'failed';

export interface LinkedWalletAccount {
  walletAddress: string;
  chainNetwork: 'stellar' | 'ethereum' | 'solana';
  isPrimary: boolean;
  linkedAt: string;
}

export interface WalletLinkChallengeSession {
  sessionId: string;
  userId: string;
  walletAddress: string;
  nonce: string;
  challengeMessage: string;
  status: WalletChallengeStatus;
  expiresAt: string;
}

export interface SignatureVerificationPayload {
  sessionId: string;
  signature: string;
  publicKey: string;
}
