import type { NextFunction, Request, Response } from "express"
import { env } from "../../../shared/config/env.js"
import { authService } from "../services/auth.service.js"
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  registerLinkedSchema,
  registerSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  verifyEmailSchema,
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

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = forgotPasswordSchema.parse(req.body)
      const result = await authService.forgotPassword(input.email)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = resetPasswordSchema.parse(req.body)
      await authService.resetPassword(input.token, input.password)
      res.status(200).json({ ok: true })
    } catch (error) {
      next(error)
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = verifyEmailSchema.parse(req.body)
      const result = await authService.verifyEmail(input.token)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async createEmailVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.createEmailVerification(req.userId!)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  },
}
