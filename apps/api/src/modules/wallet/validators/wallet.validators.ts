import { z } from "zod"

const stellarPublicKey = z
  .string()
  .regex(/^G[A-Z0-9]{55}$/, "publicKey must be a valid Stellar public key")

export const linkChallengeSchema = z.object({
  publicKey: stellarPublicKey,
})

export const verifyWalletLinkSchema = z.object({
  publicKey: stellarPublicKey,
  challenge: z.string().min(1, "challenge is required"),
  signature: z.string().min(1, "signature is required"),
})

export type LinkChallengeRequest = z.infer<typeof linkChallengeSchema>
export type VerifyWalletLinkRequest = z.infer<typeof verifyWalletLinkSchema>
