/**
 * rate-limiter.ts
 *
 * Minimal in-process sliding-window rate limiter for auth endpoints.
 * Thresholds are configurable via environment variables.
 */
import type { NextFunction, Request, Response } from "express";

import { env } from "./env.js";

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

function key(route: string, ip: string): string {
  return `${route}:${ip}`;
}

function getIp(req: Request): string {
  return (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress
    ?? "unknown";
}

function createLimiter(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const k = key(req.path, getIp(req));
    const now = Date.now();
    let w = store.get(k);

    if (!w || now >= w.resetAt) {
      w = { count: 0, resetAt: now + windowMs };
      store.set(k, w);
    }

    w.count++;

    if (w.count > max) {
      const retryAfter = Math.ceil((w.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        error: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
        retryAfter,
      });
      return;
    }

    next();
  };
}

/** Per-route limiters with distinct thresholds. */
export const rateLimiters = {
  register: createLimiter(env.RATE_LIMIT_REGISTER_MAX, env.RATE_LIMIT_WINDOW_MS),
  login:    createLimiter(env.RATE_LIMIT_LOGIN_MAX,    env.RATE_LIMIT_WINDOW_MS),
  refresh:  createLimiter(env.RATE_LIMIT_REFRESH_MAX,  env.RATE_LIMIT_WINDOW_MS),
};

/** Clears the in-process store (test helper). */
export function resetRateLimitStore(): void {
  store.clear();
}
