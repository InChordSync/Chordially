import type { Request } from "express"
import { AppError } from "../errors/app-error.js"

/**
 * Reads the authenticated user id attached by requireAuth. A non-null
 * assertion here would turn a missing/misrouted auth gate into a 500 (or,
 * worse, an undefined id reaching a service); fail as an explicit 401 instead.
 */
export function requestUserId(req: Request): string {
  const userId = (req as Request & { userId?: string }).userId
  if (typeof userId !== "string" || userId.length === 0) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required")
  }
  return userId
}
