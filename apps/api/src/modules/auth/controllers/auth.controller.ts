import type { NextFunction, Request, Response } from "express"
import { env } from "../../../shared/config/env.js"
import { authService } from "../services/auth.service.js"
import { loginSchema, registerLinkedSchema, registerSchema } from "../validators/auth.validators.js"

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
}
