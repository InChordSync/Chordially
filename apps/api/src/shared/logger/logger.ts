import type { LoggerLogLevel } from "@chordially/shared"
import { env } from "../config/env.js"
import { getRequestId } from "./request-context.js"

type LogLevel = "info" | "warn" | "error"

// Ordered by severity so a configured level can drop everything below it.
// `debug` is in the scale even though the logger has no debug call sites yet,
// so raising LOG_LEVEL to debug does not need a code change later.
const LEVEL_WEIGHT: Record<LoggerLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function isEnabled(level: LogLevel): boolean {
  // Read per call rather than at module load: env.LOG_LEVEL is a plain
  // property, and reading it lazily keeps it adjustable in tests.
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[env.LOG_LEVEL]
}

function emit(level: LogLevel, line: string): void {
  if (level === "error") {
    console.error(line)
  } else if (level === "warn") {
    console.warn(line)
  } else {
    console.log(line)
  }
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!isEnabled(level)) return

  const timestamp = new Date().toISOString()
  const requestId = getRequestId()

  if (env.NODE_ENV === "development") {
    // Human-readable while iterating locally. One line per event, same fields
    // as the production shape, just not JSON.
    const request = requestId ? ` requestId=${requestId}` : ""
    const detail = meta ? ` ${JSON.stringify(meta)}` : ""

    emit(level, `${timestamp} ${level.toUpperCase()} ${message}${request}${detail}`)
    return
  }

  emit(
    level,
    JSON.stringify({
      level,
      message,
      timestamp,
      // Stamped here rather than at each call site so that every line written
      // while a request is in flight carries the same id, including lines from
      // code that has no idea a request exists.
      ...(requestId ? { requestId } : {}),
      ...(meta ? { meta } : {}),
    }),
  )
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
}
