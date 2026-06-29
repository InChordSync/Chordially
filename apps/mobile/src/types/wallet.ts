export interface WalletConnection {
  publicKey: string
  network: 'testnet' | 'public'
  connectedAt: string
  verified: boolean
}

export interface WalletLinkResponse {
  success: true
  connection: WalletConnection
}

export interface WalletUnlinkResponse {
  success: true
  message: string
}

export type LinkState =
  | { status: 'idle' }
  | { status: 'linking' }
  | { status: 'awaiting_verification'; publicKey: string }
  | { status: 'verified'; connection: WalletConnection }
  | { status: 'error'; message: string }

export type UnlinkState =
  | { status: 'idle' }
  | { status: 'confirming' }
  | { status: 'unlinking' }
  | { status: 'done' }
  | { status: 'error'; message: string }
