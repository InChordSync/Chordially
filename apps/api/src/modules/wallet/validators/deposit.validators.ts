import { z } from "zod"

export const createDepositSchema = z.object({
  assetCode: z.enum(["native", "USDC"]).default("native"),
})

export type CreateDepositRequest = z.infer<typeof createDepositSchema>
