import { z } from "zod"

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>
