import { prisma } from "../../../shared/database/prisma.js"

export const notificationRepository = {
  findManyForRecipient(recipientId: string, page: number, pageSize: number) {
    return prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  },

  countForRecipient(recipientId: string): Promise<number> {
    return prisma.notification.count({ where: { recipientId } })
  },

  countForRecipientUnread(recipientId: string): Promise<number> {
    return prisma.notification.count({ where: { recipientId, read: false } })
  },

  findByIdForRecipient(id: string, recipientId: string) {
    return prisma.notification.findFirst({
      where: { id, recipientId },
    })
  },

  markRead(id: string, recipientId: string) {
    return prisma.notification.updateMany({
      where: { id, recipientId },
      data: { read: true },
    })
  },

  markAllRead(recipientId: string) {
    return prisma.notification.updateMany({
      where: { recipientId, read: false },
      data: { read: true },
    })
  },
}
