import type { Request, Response } from 'express'
import { notificationService } from '../services/notification.service'

export async function createNotification(req: Request, res: Response) {
  const notification = await notificationService.create({
    ...req.body,
    userId: req.user!.sub,
  })
  res.status(201).json(notification)
}

export async function listNotifications(req: Request, res: Response) {
  const { limit, offset, type } = req.query
  const result = await notificationService.list(req.user!.sub, {
    limit: Number(limit) || 20,
    offset: Number(offset) || 0,
    type: type as string | undefined,
  })
  res.json(result)
}

export async function markRead(req: Request, res: Response) {
  const { id } = req.params
  await notificationService.markRead(id, req.user!.sub)
  res.status(204).end()
}

export async function markAllRead(req: Request, res: Response) {
  await notificationService.markAllRead(req.user!.sub)
  res.status(204).end()
}
