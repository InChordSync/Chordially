import type { Notification } from '@chordially/shared'
import { db } from '../../../shared/db'

export const notificationService = {
  async create(data: Partial<Notification> & { userId: string; type: string; title: string; body: string }) {
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.userId, data.type, data.title, data.body, JSON.stringify(data.metadata || {})]
    )
    return result.rows[0]
  },

  async list(userId: string, opts: { limit: number; offset: number; type?: string }) {
    const conditions = ['user_id = $1']
    const params: unknown[] = [userId]
    if (opts.type) {
      conditions.push(`type = $${params.length + 1}`)
      params.push(opts.type)
    }
    const where = conditions.join(' AND ')
    const countResult = await db.query(`SELECT COUNT(*) FROM notifications WHERE ${where}`, params)
    const dataResult = await db.query(
      `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, opts.limit, opts.offset]
    )
    return { notifications: dataResult.rows, total: Number(countResult.rows[0].count) }
  },

  async markRead(id: string, userId: string) {
    await db.query(
      `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )
  },

  async markAllRead(userId: string) {
    await db.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    )
  },
}
