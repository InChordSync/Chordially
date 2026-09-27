import type { NextFunction, Request, Response } from "express"
import { notificationService } from "../services/notification.service.js"
import { listNotificationsSchema } from "../validators/notification.validators.js"

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipientId = req.userId!
      const query = listNotificationsSchema.parse(req.query)

      const result = await notificationService.listForRecipient(
        recipientId,
        query.page,
        query.pageSize
      )

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipientId = req.userId!
      const { id } = req.params

      const notification = await notificationService.markRead(recipientId, id!)

      res.status(200).json(notification)
    } catch (error) {
      next(error)
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipientId = req.userId!
      const result = await notificationService.markAllRead(recipientId)

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },
}
