import type { Env } from "./env.js"

/** Docs and Swagger UI are never exposed in production, even if explicitly enabled. */
export function shouldServeDocs(nodeEnv: Env["NODE_ENV"], enabled: boolean): boolean {
  return nodeEnv !== "production" && enabled
}
