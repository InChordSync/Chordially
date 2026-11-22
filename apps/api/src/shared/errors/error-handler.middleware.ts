import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { AppError } from "./app-error.js"
import { logger } from "../logger/logger.js"

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) return

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    })
    return
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        details: error.errors.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    })
    return
  }

  logger.error("Unhandled request error", {
    method: req.method,
    path: req.originalUrl,
    error: error instanceof Error ? error.message : String(error),
  })

  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  })
}
