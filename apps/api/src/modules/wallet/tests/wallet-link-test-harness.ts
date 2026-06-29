import type { WalletLinkState, Sep10Challenge, Sep10Verified } from '@chordially/shared'
import { randomUUID } from 'crypto'

export function createWalletLinkTestHarness() {
  const sessions = new Map<string, WalletLinkState>()

  return {
    async createSession(userId: string, publicKey: string, network: string): Promise<WalletLinkState> {
      const state: WalletLinkState = {
        linkId: randomUUID(),
        userId,
        publicKey,
        status: 'pending',
        network: network as any,
        linkedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        unlinkedAt: null,
        sessionExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }
      sessions.set(state.linkId, state)
      return state
    },

    async verifyLink(sessionId: string): Promise<WalletLinkState> {
      const session = sessions.get(sessionId)
      if (!session) throw new Error('Session not found')
      session.status = 'active'
      session.lastVerifiedAt = new Date().toISOString()
      return session
    },

    async unlink(sessionId: string): Promise<WalletLinkState> {
      const session = sessions.get(sessionId)
      if (!session) throw new Error('Session not found')
      session.status = 'unlinked'
      session.unlinkedAt = new Date().toISOString()
      return session
    },

    async createSep10Challenge(): Promise<Sep10Challenge> {
      return { transaction: `challenge-${randomUUID()}`, networkPassphrase: 'Test SDF Network ; September 2024', expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() }
    },

    async verifySep10(): Promise<Sep10Verified> {
      return { token: `test-token-${randomUUID()}`, walletLinkId: randomUUID() }
    },

    getSession(sessionId: string): WalletLinkState | undefined {
      return sessions.get(sessionId)
    },
  }
}
