import { z } from "zod"

export const notificationEventTypeSchema = z.enum([
  "FOLLOW",
  "UNFOLLOW",
  "DISCOVERY_TRENDING",
  "NEW_CREATOR_POST",
  "MENTION",
])

export type NotificationEventType = z.infer<typeof notificationEventTypeSchema>

export const notificationSeedSchema = z.object({
  id: z.string().min(1),
  recipientId: z.string().min(1),
  actorId: z.string().optional(),
  type: notificationEventTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  read: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional().default({}),
  createdAt: z.string().datetime().or(z.date()).transform((val) => new Date(val).toISOString()),
})

export type NotificationSeedInput = z.infer<typeof notificationSeedSchema>

export function createNotificationSeed(input: Partial<NotificationSeedInput> & { recipientId: string; type: NotificationEventType; title: string; body: string }): NotificationSeedInput {
  const seed = {
    id: input.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: input.type,
    title: input.title,
    body: input.body,
    read: input.read ?? false,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ? new Date(input.createdAt).toISOString() : new Date().toISOString(),
  }
  return notificationSeedSchema.parse(seed)
}
