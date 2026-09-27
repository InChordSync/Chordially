import { z } from "zod"

export const createCreatorPayoutSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,7})?$/, "amount must be a positive decimal string")
    .refine((value) => Number(value) > 0, "amount must be greater than zero"),
  assetCode: z.enum(["native", "USDC"]).default("native"),
  idempotencyKey: z.string().uuid("idempotencyKey must be a valid UUID"),
})

export type CreateCreatorPayoutRequest = z.infer<typeof createCreatorPayoutSchema>
