import { z } from "zod"

export const MAX_STREAM_TITLE_LENGTH = 140

export const startStreamSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "title cannot be empty")
      .max(MAX_STREAM_TITLE_LENGTH, `title must be at most ${MAX_STREAM_TITLE_LENGTH} characters`)
      .optional(),
  })
  .strict()
  .default({})

export type StartStreamRequest = z.infer<typeof startStreamSchema>
