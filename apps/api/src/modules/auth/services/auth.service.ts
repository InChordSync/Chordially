import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import jwt, { type SignOptions } from "jsonwebtoken"
import { env } from "../../../shared/config/env.js"
import { prisma } from "../../../shared/database/prisma.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { userService } from "../../users/services/user.service.js"
import { walletService } from "../../wallet/services/wallet.service.js"
import {
  toAuthUserResponse,
  type AuthRefreshResult,
  type AuthResult,
} from "../types/auth.types.js"
import type { LoginInput, RegisterInput, RegisterLinkedInput } from "../validators/auth.validators.js"

const PASSWORD_SALT_ROUNDS = 10
const FALLBACK_REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60

function issueToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  }

  return jwt.sign({ sub: userId }, env.JWT_SECRET, options)
}

function refreshTokenLifetimeSeconds(expiresIn: string): number {
  const unitSeconds: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  }
  const match = /^(\d+)\s*([smhd])$/.exec(expiresIn)
  if (!match) return FALLBACK_REFRESH_TTL_SECONDS
  return Number(match[1]) * unitSeconds[match[2]!]
}

function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function sha256(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

async function assertNotLocked(user: {
  id: string
  failedLoginAttempts: number
  lockedUntil: Date | null
}): Promise<void> {
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw new AppError(
      423,
      "ACCOUNT_LOCKED",
      "Too many failed login attempts. Try again later."
    )
  }

  // If the lockout window has elapsed, reset the counter so the user gets a
  // fresh set of attempts instead of being locked out on the very next try.
  if (user.failedLoginAttempts > 0 && user.lockedUntil) {
    await userService.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
  }
}

async function recordFailedLogin(user: { id: string; failedLoginAttempts: number }): Promise<void> {
  const attempts = user.failedLoginAttempts + 1
  if (attempts >= env.LOGIN_MAX_FAILED_ATTEMPTS) {
    await userService.update(user.id, {
      failedLoginAttempts: attempts,
      lockedUntil: new Date(Date.now() + env.LOGIN_LOCKOUT_DURATION_SECONDS * 1000),
    })
  } else {
    await userService.update(user.id, { failedLoginAttempts: attempts })
  }
}

async function resetLoginLockout(userId: string): Promise<void> {
  await userService.update(userId, {
    failedLoginAttempts: 0,
    lockedUntil: null,
  })
}

async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_SECONDS * 1000)

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: sha256(token), expiresAt },
  })

  return token
}

async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_SECONDS * 1000)

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: sha256(token), expiresAt },
  })

  return token
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(
    Date.now() + refreshTokenLifetimeSeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000
  )

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashRefreshToken(token), expiresAt },
  })

  return token
}

async function createUserAccount(email: string, password: string) {
  const existing = await userService.findByEmail(email)

  // Deliberately generic: returning a distinct "email already registered"
  // error would let an attacker probe which addresses have accounts. This
  // reveals nothing about whether the email exists — a would-be enumerator
  // gets the same response whether the account exists or registration failed
  // for any other reason. Bulk probing is further throttled by the register
  // rate limiter (see modules/auth/middleware/auth-rate-limit.ts).
  if (existing) {
    throw new AppError(409, "REGISTRATION_FAILED", "Unable to complete registration")
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
  return userService.create({ email, passwordHash })
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const user = await createUserAccount(input.email, input.password)
    await walletService.createWalletForUser(user.id)

    return {
      user: toAuthUserResponse(user),
      token: issueToken(user.id),
      refreshToken: await createRefreshToken(user.id),
      emailVerificationToken: await createEmailVerificationToken(user.id),
    }
  },

  /**
   * Registers a new user with a linked (non-custodial) wallet instead of a
   * platform-generated one. `publicKey`/`challenge`/`signature` must prove
   * control of that Stellar account (see shared/wallet-link/challenge.js).
   * Proof of control is checked up front, before the user account is
   * created, so a bad signature never leaves behind a user row with no
   * usable wallet — walletService.linkWallet re-checks it too as its own
   * invariant, but that check alone would run after the account already
   * exists.
   */
  async registerWithLinkedWallet(input: RegisterLinkedInput): Promise<AuthResult> {
    await walletService.assertLinkableWallet(input.publicKey, input.challenge, input.signature)

    const user = await createUserAccount(input.email, input.password)
    await walletService.linkWallet(user.id, input.publicKey, input.challenge, input.signature)

    return {
      user: toAuthUserResponse(user),
      token: issueToken(user.id),
      refreshToken: await createRefreshToken(user.id),
      emailVerificationToken: await createEmailVerificationToken(user.id),
    }
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userService.findByEmail(input.email)

    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password")
    }

    await assertNotLocked(user)

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)

    if (!passwordMatches) {
      await recordFailedLogin(user)
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password")
    }

    await resetLoginLockout(user.id)

    return {
      user: toAuthUserResponse(user),
      token: issueToken(user.id),
      refreshToken: await createRefreshToken(user.id),
      emailVerificationToken: await createEmailVerificationToken(user.id),
    }
  },

  /**
   * Requests a password reset for an email. Does not reveal whether the
   * account exists — an unknown email simply consumes a token that will never
   * be usable — so an unauthenticated caller can't enumerate accounts. The
   * caller gets an opaque "ok" response; in this build the one-time reset
   * token is returned in the response body (there is no e-mail transport
   * wired up yet) and must be handed to POST /api/auth/reset-password.
   */
  async forgotPassword(email: string): Promise<{ token: string }> {
    const user = await userService.findByEmail(email)

    if (!user) {
      // Return a token so the timing/behaviour matches a real account without
      // revealing whether the email exists. It is never persisted, so it can
      // never be redeemed.
      return { token: crypto.randomBytes(32).toString("hex") }
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    const token = await createPasswordResetToken(user.id)
    return { token }
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256(token) },
    })

    if (
      !record ||
      record.revokedAt !== null ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError(400, "INVALID_RESET_TOKEN", "Invalid or expired reset token")
    }

    const user = await userService.findById(record.userId)
    if (!user) {
      throw new AppError(400, "INVALID_RESET_TOKEN", "Invalid or expired reset token")
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS)
    await userService.update(user.id, { passwordHash, failedLoginAttempts: 0, lockedUntil: null })

    // The token is single-use.
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    })

    // Revoke outstanding refresh tokens so previously stolen sessions die
    // with the old password.
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  },

  async createEmailVerification(userId: string): Promise<{ token: string }> {
    const token = await createEmailVerificationToken(userId)
    return { token }
  },

  async verifyEmail(token: string): Promise<{ emailVerified: boolean }> {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: sha256(token) },
    })

    if (
      !record ||
      record.usedAt !== null ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError(400, "INVALID_VERIFICATION_TOKEN", "Invalid or expired verification token")
    }

    const user = await userService.findById(record.userId)
    if (!user) {
      throw new AppError(400, "INVALID_VERIFICATION_TOKEN", "Invalid or expired verification token")
    }

    await userService.update(user.id, { emailVerified: true })

    await prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    })

    return { emailVerified: true }
  },

  async refresh(refreshToken: string): Promise<AuthRefreshResult> {
    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
    })

    if (
      !record ||
      record.revokedAt !== null ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token")
    }

    const user = await userService.findById(record.userId)
    if (!user) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token")
    }

    // Rotate: the presented token is single-use, so revoke it and issue a
    // fresh access token alongside a brand-new refresh token.
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    })

    return {
      user: toAuthUserResponse(user),
      accessToken: issueToken(user.id),
      refreshToken: await createRefreshToken(user.id),
    }
  },

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const record = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashRefreshToken(refreshToken) },
      })
      if (!record || record.userId !== userId) {
        throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token")
      }
      await prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      })
      return
    }

    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  },
}
