import { z } from "zod"

export { loginSchema, registerSchema } from "@chordially/shared"
export type { LoginInput, RegisterInput } from "@chordially/shared"

// Kept local to apps/api (not in @chordially/shared's registerSchema) since
// this is a distinct signup path for a non-custodial wallet, not a variant
// of the standard web/mobile registration form.
export const registerLinkedSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  publicKey: z.string().regex(/^G[A-Z0-9]{55}$/, "publicKey must be a valid Stellar public key"),
  challenge: z.string().min(1, "challenge is required"),
  signature: z.string().min(1, "signature is required"),
})

export type RegisterLinkedInput = z.infer<typeof registerLinkedSchema>
