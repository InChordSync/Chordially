export interface NotificationResponse {
  id: string
  actorId: string | null
  type: string
  title: string
  body: string
  metadata: Record<string, unknown>
  read: boolean
  createdAt: string
}

export function toNotificationResponse(notification: {
  id: string
  actorId: string | null
  type: string
  title: string
  body: string
  metadata: string
  read: boolean
  createdAt: Date
}): NotificationResponse {
  let metadata: Record<string, unknown> = {}
  try {
    metadata = JSON.parse(notification.metadata)
  } catch {
    metadata = {}
  }
  return {
    id: notification.id,
    actorId: notification.actorId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    metadata,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  }
}
