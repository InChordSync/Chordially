import { z } from "zod"

export const discoveryFiltersSchema = z.object({
  genre: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  sort: z.enum(["freshness", "activity", "followers"]).default("freshness"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type DiscoveryFiltersInput = z.infer<typeof discoveryFiltersSchema>
