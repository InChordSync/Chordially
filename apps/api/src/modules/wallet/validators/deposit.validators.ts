import { z } from "zod"

export const createDepositSchema = z.object({
  assetCode: z.enum(["native", "USDC"]).default("native"),
  idempotencyKey: z
    .string()
    .uuid("idempotencyKey must be a valid UUID")
    .optional(),
})

export type CreateDepositRequest = z.infer<typeof createDepositSchema>
