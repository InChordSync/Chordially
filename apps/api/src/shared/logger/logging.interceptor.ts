import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common"
import type { Request, Response } from "express"
import { Observable, tap } from "rxjs"
import { StructuredRequestLogger } from "../../middleware/structured-request-logging.middleware.js"
import { logger } from "./logger.js"
import {
  REQUEST_ID_HEADER,
  resolveRequestId,
  runWithRequestContext,
} from "./request-context.js"

/** Sub-millisecond precision is worth keeping; long decimal noise is not. */
function toMilliseconds(nanoseconds: bigint): number {
  return Math.round((Number(nanoseconds) / 1e6) * 100) / 100
}

/**
 * Emits one structured summary line per HTTP request and makes the request's
 * correlation id available to every log call made while handling it.
 *
 * Registered globally (see AppModule), so it covers every controller without
 * each route having to opt in.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only HTTP requests have a status, a path and a client to correlate. Other
    // execution contexts (RPC, WS, queue handlers) pass straight through.
    if (context.getType() !== "http") return next.handle()

    const http = context.switchToHttp()
    const req = http.getRequest<Request>()
    const res = http.getResponse<Response>()

    const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER])
    req.requestId = requestId
    // Echo it back so a client can quote the id when reporting a problem.
    res.setHeader(REQUEST_ID_HEADER, requestId)

    const path = req.originalUrl || req.url || req.method
    const startedAt = process.hrtime.bigint()

    const record = (failed: boolean) => {
      const durationMs = toMilliseconds(process.hrtime.bigint() - startedAt)
      // An escaping exception can leave the default 200 in place until a filter
      // runs, so an error is never reported as a success.
      const statusCode = res.statusCode >= 400 ? res.statusCode : failed ? 500 : res.statusCode

      try {
        const entry = StructuredRequestLogger.createLogEntry(
          req.method,
          path,
          statusCode,
          durationMs,
          {
            requestId,
            clientIp: req.ip,
            userAgent: req.get?.("user-agent"),
          }
        )

        // Spread into a fresh object literal: `StructuredLogEntry` is an
        // interface, so it has no implicit index signature and cannot be
        // passed to the logger's `Record<string, unknown>` meta parameter.
        const meta = { ...entry }

        if (entry.level === "error") {
          logger.error(entry.message, meta)
        } else if (entry.level === "warn") {
          logger.warn(entry.message, meta)
        } else {
          logger.info(entry.message, meta)
        }
      } catch {
        // A logging failure must never turn a served request into a failed one.
      }
    }

    // The subscription — not the construction — has to happen inside the
    // context. `next.handle()` returns a cold Observable that Nest does not
    // subscribe to until after this method returns, so wrapping only the
    // creation would leave the handler body outside the context and every log
    // line it wrote would be missing the request id.
    return new Observable<unknown>((subscriber) =>
      runWithRequestContext({ requestId, method: req.method, path }, () =>
        next.handle()
          .pipe(
            tap({
              next: () => record(false),
              error: () => record(true),
            }),
          )
          .subscribe(subscriber),
      ),
    )
  }
}
