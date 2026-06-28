import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { AppError } from "../errors/app-error.js"

interface AccessTokenPayload {
  sub: string
}

const BEARER_PREFIX = "Bearer "

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    throw new AppError(401, "UNAUTHORIZED", "Missing or invalid authorization header")
  }

  const token = header.slice(BEARER_PREFIX.length)

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload
    req.userId = payload.sub
    next()
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token")
  }
}

export function requireOptionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next()
    return
  }

  const token = header.slice(BEARER_PREFIX.length)

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload
    req.userId = payload.sub
  } catch {
    // token invalid — continue without auth
  }

  next()
}
