import { db } from '../../../shared/db'
import { randomUUID } from 'crypto'

export const walletLinkService = {
  async createSession(userId: string, publicKey: string, network: string) {
    const session = await db.query(
      `INSERT INTO wallet_sessions (user_id, public_key, network, status, expires_at)
       VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '15 minutes')
       RETURNING *`,
      [userId, publicKey, network]
    )
    return session.rows[0]
  },

  async verifyLink(sessionId: string, signature: string) {
    const session = await db.query(
      `UPDATE wallet_sessions SET status = 'active', verified_at = NOW(), signature = $2
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [sessionId, signature]
    )
    if (session.rows.length === 0) throw new Error('Session not found or already expired')
    return session.rows[0]
  },

  async unlink(sessionId: string, userId: string) {
    const result = await db.query(
      `UPDATE wallet_sessions SET status = 'unlinked', unlinked_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING *`,
      [sessionId, userId]
    )
    if (result.rows.length === 0) throw new Error('Active session not found')
    await db.query(
      `INSERT INTO wallet_audit_log (user_id, session_id, action)
       VALUES ($1, $2, 'unlink')`,
      [userId, sessionId]
    )
    return result.rows[0]
  },

  async getSession(sessionId: string) {
    const result = await db.query('SELECT * FROM wallet_sessions WHERE id = $1', [sessionId])
    return result.rows[0] || null
  },

  async getOrCreateIdentity(userId: string) {
    const existing = await db.query('SELECT * FROM wallet_identities WHERE user_id = $1', [userId])
    if (existing.rows.length > 0) return existing.rows[0]
    const identity = await db.query(
      `INSERT INTO wallet_identities (user_id, identity_key)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, randomUUID()]
    )
    return identity.rows[0]
  },

  async createSep10Challenge(publicKey: string) {
    return {
      transaction: `challenge-${randomUUID()}`,
      networkPassphrase: 'Test SDF Network ; September 2024',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }
  },

  async verifySep10(challengeTransaction: string, signature: string) {
    const valid = signature.length > 0
    if (!valid) throw new Error('Invalid SEP-10 signature')
    return { token: `sep10-token-${randomUUID()}`, walletLinkId: randomUUID() }
  },
}
