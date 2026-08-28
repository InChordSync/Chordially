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

  if (existing) {
    throw new AppError(409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists")
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
    }
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

    return {
      user: toAuthUserResponse(user),
      token: issueToken(user.id),
      refreshToken: await createRefreshToken(user.id),
    }
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
