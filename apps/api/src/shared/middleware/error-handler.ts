import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { AppError } from "../errors/app-error.js"
import { logger } from "../logger/logger.js"

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } })
    return
  }

  if (
    typeof err === "object" &&
    err !== null &&
    (err as { status?: number }).status === 413
  ) {
    res.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" },
    })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.issues.map((issue) => issue.message).join(", "),
      },
    })
    return
  }

  logger.error("Unhandled error", {
    error: err instanceof Error ? err.message : String(err),
  })
  res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" },
  })
}
