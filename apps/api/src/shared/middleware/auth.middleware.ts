import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { AppError } from "../errors/app-error.js"

interface AccessTokenPayload {
  sub: string
}

const BEARER_PREFIX = "Bearer "
const AUTH_TOKEN_COOKIE = "chordially.token"

function readCookieToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=")
    if (separator === -1) continue

    const name = part.slice(0, separator).trim()
    if (name !== AUTH_TOKEN_COOKIE) continue

    const value = part.slice(separator + 1).trim()
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return null
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  let token: string | null = null

  if (header && header.startsWith(BEARER_PREFIX)) {
    token = header.slice(BEARER_PREFIX.length)
  } else {
    token = readCookieToken(req)
  }

  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "Missing or invalid authorization header")
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload
    req.userId = payload.sub
    next()
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token")
  }
}
