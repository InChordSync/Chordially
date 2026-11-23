import { z } from "zod"

export const createCreatorProfileSchema = z.object({
  displayName: z.string().trim().min(1, "displayName is required").max(80),
  bio: z.string().max(2000).optional(),
  genre: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
})

export const updateCreatorProfileSchema = createCreatorProfileSchema.partial().extend({
  bio: z.string().max(2000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export type CreateCreatorProfileRequest = z.infer<typeof createCreatorProfileSchema>
export type UpdateCreatorProfileRequest = z.infer<typeof updateCreatorProfileSchema>
