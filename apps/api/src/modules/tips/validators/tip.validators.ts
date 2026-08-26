import { z } from "zod"

export const createTipSchema = z.object({
  creatorId: z.string().min(1, "creatorId is required"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,7})?$/, "amount must be a positive decimal string")
    .refine((value) => Number(value) > 0, "amount must be greater than zero"),
  idempotencyKey: z.string().uuid("idempotencyKey must be a valid UUID"),
  streamId: z.string().min(1).optional(),
  asset: z.enum(["native", "USDC"]).default("native"),
})

export type CreateTipRequest = z.infer<typeof createTipSchema>
