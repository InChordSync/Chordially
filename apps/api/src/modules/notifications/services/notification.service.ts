import { AppError } from "../../../shared/errors/app-error.js"
import { notificationRepository } from "../repositories/notification.repository.js"
import {
  toNotificationResponse,
  type NotificationResponse,
} from "../types/notification.types.js"

export interface NotificationListResult {
  items: NotificationResponse[]
  page: number
  pageSize: number
  total: number
  unread: number
}

export const notificationService = {
  async listForRecipient(
    recipientId: string,
    page = 1,
    pageSize = 20
  ): Promise<NotificationListResult> {
    const items = await notificationRepository.findManyForRecipient(
      recipientId,
      page,
      pageSize
    )
    const [total, unread] = await Promise.all([
      notificationRepository.countForRecipient(recipientId),
      notificationRepository.countForRecipientUnread(recipientId),
    ])

    return {
      items: items.map(toNotificationResponse),
      page,
      pageSize,
      total,
      unread,
    }
  },

  async markRead(recipientId: string, id: string): Promise<NotificationResponse> {
    const existing = await notificationRepository.findByIdForRecipient(id, recipientId)
    if (!existing) {
      throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification not found")
    }

    await notificationRepository.markRead(id, recipientId)

    const updated = await notificationRepository.findByIdForRecipient(id, recipientId)
    return toNotificationResponse(updated!)
  },

  async markAllRead(recipientId: string): Promise<{ count: number }> {
    const result = await notificationRepository.markAllRead(recipientId)
    return { count: result.count }
  },
}
