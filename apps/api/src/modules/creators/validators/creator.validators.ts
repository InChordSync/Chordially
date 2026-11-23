import { z } from "zod"

/** Request bodies for POST/PATCH /api/creators. */
export const createCreatorProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  bio: z.string().max(300).optional(),
  genre: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
})

export const updateCreatorProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  genre: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
})

export type CreateCreatorProfileInput = z.infer<typeof createCreatorProfileSchema>
export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>
