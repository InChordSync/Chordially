import bcrypt from "bcryptjs"
import jwt, { type SignOptions } from "jsonwebtoken"
import { env } from "../../../shared/config/env.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { userService } from "../../users/services/user.service.js"
import { onboardingRepository } from "../../users/repositories/onboarding.repository.js"
import { toAuthUserResponse, type AuthResult } from "../types/auth.types.js"
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js"

const PASSWORD_SALT_ROUNDS = 10

function issueToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  }

  return jwt.sign({ sub: userId }, env.JWT_SECRET, options)
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await userService.findByEmail(input.email)

    if (existing) {
      throw new AppError(
        409,
        "EMAIL_ALREADY_REGISTERED",
        "An account with this email already exists"
      )
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS)
    const user = await userService.create({ email: input.email, passwordHash })

    const ALL_STEPS = [
      "displayName",
      "avatarUrl",
      "bio",
      "genre",
      "location",
      "tags",
      "bannerUrl",
      "genrePrefs",
    ]
    await onboardingRepository.createSteps(user.id, ALL_STEPS)

    return { user: toAuthUserResponse(user), token: issueToken(user.id) }
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userService.findByEmail(input.email)

    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password")
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)

    if (!passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password")
    }

    return { user: toAuthUserResponse(user), token: issueToken(user.id) }
  },
}
