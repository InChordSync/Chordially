import { AsyncLocalStorage } from "node:async_hooks"
import { randomUUID } from "node:crypto"

/** Header carrying the caller's correlation id, in and out. */
export const REQUEST_ID_HEADER = "x-request-id"

/** Upper bound on an accepted correlation id, to keep log lines bounded. */
export const MAX_REQUEST_ID_LENGTH = 128

export interface RequestContextValue {
  requestId: string
  method: string
  path: string
}

const storage = new AsyncLocalStorage<RequestContextValue>()

/**
 * Runs `fn` with the in-flight request's correlation id visible to anything it
 * calls, including code several awaits deep. This is what makes the id appear
 * on every log line for a request rather than only on the request summary:
 * a plain module-level singleton has no way to know which request it is
 * currently servicing.
 */
export function runWithRequestContext<T>(context: RequestContextValue, fn: () => T): T {
  return storage.run(context, fn)
}

export function getRequestContext(): RequestContextValue | undefined {
  return storage.getStore()
}

/** The current request's id, or undefined outside a request. */
export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId
}

/**
 * Strips control characters and caps length before the value is trusted.
 *
 * The id is caller-supplied and ends up in a log file, so an unfiltered value
 * would let a client forge log lines (and blow up a line-oriented log shipper)
 * just by putting a newline in a header.
 */
function sanitize(raw: string): string {
  // eslint-disable-next-line no-control-regex
  const stripped = raw.replace(/[\u0000-\u001f\u007f]/g, "").trim()
  return stripped.slice(0, MAX_REQUEST_ID_LENGTH)
}

export function generateRequestId(): string {
  return `req_${randomUUID().replace(/-/g, "").slice(0, 16)}`
}

/**
 * Adopts the caller's correlation id when it sends one, otherwise mints a new
 * one. An id that is empty or nothing but control characters is treated as
 * absent rather than passed through as blank.
 */
export function resolveRequestId(headerValue: unknown): string {
  if (typeof headerValue === "string") {
    const sanitized = sanitize(headerValue)
    if (sanitized) return sanitized
  }

  return generateRequestId()
}
