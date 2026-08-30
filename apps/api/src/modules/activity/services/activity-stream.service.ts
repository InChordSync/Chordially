import { z } from "zod"

export const activityItemSchema = z.object({
  id: z.string().min(1),
  creatorId: z.string().min(1),
  type: z.enum(["POST_CREATED", "PROFILE_UPDATED", "STREAM_STARTED"]),
  title: z.string().min(1),
  summary: z.string().optional(),
  createdAt: z.string().datetime().or(z.date()).transform((val) => new Date(val).toISOString()),
})

export type ActivityItemInput = z.infer<typeof activityItemSchema>

export class ActivityStreamService {
  private static items: ActivityItemInput[] = []

  public static addActivity(item: ActivityItemInput): ActivityItemInput {
    const validated = activityItemSchema.parse(item)
    this.items.unshift(validated)
    return validated
  }

  public static getActivities(
    creatorId?: string,
    limit = 20,
    offset = 0
  ): ActivityItemInput[] {
    if (creatorId) {
      return this.items.filter((i) => i.creatorId === creatorId).slice(offset, offset + limit)
    }
    return this.items.slice(offset, offset + limit)
  }

  public static clear(): void {
    this.items = []
  }
}
