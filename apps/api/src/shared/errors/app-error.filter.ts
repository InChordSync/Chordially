import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common"
import type { Response } from "express"
import { ZodError } from "zod"
import { AppError } from "./app-error.js"
import { logger } from "../logger/logger.js"

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>()

    if (exception instanceof AppError) {
      res.status(exception.statusCode).json({
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.details ? { details: exception.details } : {}),
        },
      })
      return
    }

    if (exception instanceof ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: exception.errors.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      })
      return
    }

    logger.error("Unhandled Nest error", {
      error: exception instanceof Error ? exception.message : String(exception),
    })
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    })
  }
}
