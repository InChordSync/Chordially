import type { NextFunction, Request, Response } from "express"
import { env } from "../../../shared/config/env.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { authService } from "../services/auth.service.js"
import { loginPerAccountRateLimiter, loginPerIpRateLimiter } from "../services/auth-rate-limiters.js"
import {
  loginSchema,
  logoutSchema,
  registerLinkedSchema,
  registerSchema,
  refreshTokenSchema,
} from "../validators/auth.validators.js"

const AUTH_TOKEN_COOKIE = "chordially.token"

function setAuthTokenCookie(res: Response, token: string): void {
  res.cookie(AUTH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  })
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = registerSchema.parse(req.body)
      const result = await authService.register(input)
      setAuthTokenCookie(res, result.token)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  },

  async registerLinked(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = registerLinkedSchema.parse(req.body)
      const result = await authService.registerWithLinkedWallet(input)
      setAuthTokenCookie(res, result.token)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body)

      // Brute-force mitigation: throttle logins by both the target account
      // (email) and the caller's IP so guessing is slowed down even when
      // attempts are spread across many accounts or behind a shared NAT.
      if (!loginPerAccountRateLimiter.consume(input.email.toLowerCase())) {
        throw new AppError(
          429,
          "RATE_LIMITED",
          "Too many login attempts for this account. Please try again shortly."
        )
      }
      if (!loginPerIpRateLimiter.consume(req.ip ?? "unknown")) {
        throw new AppError(
          429,
          "IP_RATE_LIMITED",
          "Too many login attempts from this address. Please try again shortly."
        )
      }

      const result = await authService.login(input)
      setAuthTokenCookie(res, result.token)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = refreshTokenSchema.parse(req.body)
      const result = await authService.refresh(input.refreshToken)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = logoutSchema.parse(req.body ?? {})
      await authService.logout(req.userId!, input.refreshToken)
      res.status(200).json({ ok: true })
    } catch (error) {
      next(error)
    }
  },
}
