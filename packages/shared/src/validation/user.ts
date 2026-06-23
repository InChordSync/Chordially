import { z } from "zod"

export const updateMeSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50, "Display name must be at most 50 characters").optional(),
  bio: z.string().max(300, "Bio must be at most 300 characters").nullable().optional(),
  avatarUrl: z.string().url("Avatar must be a valid URL").nullable().optional(),
  genre: z.string().max(50, "Genre must be at most 50 characters").optional(),
  location: z.string().max(100, "Location must be at most 100 characters").optional(),
  genrePrefs: z.array(z.string().max(30, "Each genre preference must be at most 30 characters")).max(10, "You can have at most 10 genre preferences").optional(),
})

export type UpdateMeInput = z.infer<typeof updateMeSchema>
