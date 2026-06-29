import type { Timestamps } from './common'

export type NotificationType = 'follow' | 'tip' | 'earnings' | 'campaign_milestone' | 'system_broadcast'

export interface Notification extends Timestamps {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  metadata: Record<string, unknown>
  readAt: string | null
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  inApp: boolean
  digest: 'instant' | 'daily' | 'weekly' | 'never'
}
