import bcrypt from "bcryptjs"
import jwt, { type SignOptions } from "jsonwebtoken"
import { env } from "../../../shared/config/env.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { userService } from "../../users/services/user.service.js"
import { walletService } from "../../wallet/services/wallet.service.js"
import { toAuthUserResponse, type AuthResult } from "../types/auth.types.js"
import type { LoginInput, RegisterInput, RegisterLinkedInput } from "../validators/auth.validators.js"

const PASSWORD_SALT_ROUNDS = 10

function issueToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  }

  return jwt.sign({ sub: userId }, env.JWT_SECRET, options)
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

    return { user: toAuthUserResponse(user), token: issueToken(user.id) }
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
