import { z } from "zod"

export const discoveryFilterSchema = z.object({
  query: z.string().trim().optional().default(""),
  genre: z.string().trim().optional().default("all"),
  location: z.string().trim().optional().default(""),
  isLiveOnly: z.boolean().optional().default(false),
  minFollowers: z.number().int().nonnegative().optional().default(0),
  sortBy: z.enum(["freshness", "followers", "activity"]).optional().default("freshness"),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
})

export type DiscoveryFilterInput = z.infer<typeof discoveryFilterSchema>
