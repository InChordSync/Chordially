import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { prisma } from "../database/prisma.js"
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

/**
 * Role gate for operator-only endpoints (reconciliation run, internal
 * metrics). Must be mounted AFTER requireAuth so req.userId is populated: it
 * loads the caller's User row and checks the role column against the allowed
 * set, rejecting non-matching callers with 403. Keep the freshness trade-off
 * in mind — role is read from the DB per request, not embedded in the JWT,
 * so a role change takes effect immediately (no token reissue needed).
 */
export async function requireRole(roles: string[]) {
  return async function requireRoleMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId ?? "" },
        select: { role: true },
      })

      if (!user || !roles.includes(user.role)) {
        throw new AppError(403, "FORBIDDEN", "You do not have permission to perform this action")
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
