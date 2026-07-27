import { z } from "zod"

/**
 * Looser than `updateMeSchema`: every field is optional so an incomplete
 * onboarding form can be saved as a draft without failing validation.
 */
export const creatorProfileDraftSchema = z.object({
  displayName: z.string().max(50, "Display name must be at most 50 characters").optional(),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
  genre: z.string().max(50, "Genre must be at most 50 characters").optional(),
  location: z.string().max(100, "Location must be at most 100 characters").optional(),
})

export type CreatorProfileDraftInput = z.infer<typeof creatorProfileDraftSchema>
