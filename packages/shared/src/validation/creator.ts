import { z } from "zod"

export const updateTagsSchema = z.object({
  tags: z
    .array(z.string().max(30, "Each tag must be at most 30 characters"))
    .max(20, "You can have at most 20 tags"),
})

export const updateAvailabilitySchema = z.object({
  availability: z
    .array(
      z.object({
        day: z.string().min(1),
        slots: z.array(
          z.object({
            start: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:mm"),
            end: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:mm"),
          })
        ),
      })
    )
    .max(20, "You can have at most 20 availability windows"),
})

export const updateCreatorSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50, "Display name must be at most 50 characters").optional(),
  bio: z.string().max(300, "Bio must be at most 300 characters").nullable().optional(),
  avatarUrl: z.string().url("Avatar must be a valid URL").nullable().optional(),
  bannerUrl: z.string().url("Banner must be a valid URL").nullable().optional(),
  genre: z.string().max(50, "Genre must be at most 50 characters").optional(),
  location: z.string().max(100, "Location must be at most 100 characters").optional(),
  tags: z.array(z.string().max(30, "Each tag must be at most 30 characters")).max(20, "You can have at most 20 tags").optional(),
})

export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>
export type UpdateTagsInput = z.infer<typeof updateTagsSchema>
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>
