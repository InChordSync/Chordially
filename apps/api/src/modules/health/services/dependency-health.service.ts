import net from "node:net"
import { prisma } from "../../../shared/database/prisma.js"
import { env } from "../../../shared/config/env.js"

export interface DependencyCheckResult {
  ok: boolean
  latencyMs: number
  message?: string
}

const PROBE_TIMEOUT_MS = 1500

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("probe timed out")), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

export class DependencyHealthService {
  // Real database connectivity check via Prisma, bounded by a timeout so a
  // hung dependency can't make the readiness probe block forever.
  public async checkDatabase(): Promise<DependencyCheckResult> {
    const started = Date.now()
    try {
      await withTimeout(prisma.$queryRaw`SELECT 1`, PROBE_TIMEOUT_MS)
      return { ok: true, latencyMs: Date.now() - started }
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - started,
        message: error instanceof Error ? error.message : "database unreachable",
      }
    }
  }

  // Real cache connectivity check. When no CACHE_URL is configured the app has
  // no external cache dependency, so the subsystem reports healthy; otherwise
  // it attempts a TCP connect + Redis PING within the probe timeout.
  public async checkCache(): Promise<DependencyCheckResult> {
    const started = Date.now()
    const url = env.CACHE_URL
    if (!url) {
      return { ok: true, latencyMs: 0, message: "no cache configured" }
    }

    try {
      const ok = await withTimeout(
        new Promise<boolean>((resolve, reject) => {
          const parsed = new URL(url)
          const socket = net.createConnection({
            host: parsed.hostname,
            port: Number(parsed.port) || 6379,
          })
          const fail = (err?: Error) => {
            socket.destroy()
            reject(err ?? new Error("cache ping failed"))
          }
          socket.setTimeout(PROBE_TIMEOUT_MS)
          socket.on("connect", () => {
            socket.write("*1\r\n$4\r\nPING\r\n")
          })
          socket.on("timeout", () => fail(new Error("cache ping timed out")))
          socket.on("error", (e) => fail(e))
          socket.on("data", (chunk) => {
            if (chunk.toString().startsWith("+PONG")) {
              socket.destroy()
              resolve(true)
            } else {
              fail(new Error("cache ping got unexpected response"))
            }
          })
        }),
        PROBE_TIMEOUT_MS
      )

      return ok
        ? { ok: true, latencyMs: Date.now() - started }
        : { ok: false, latencyMs: Date.now() - started, message: "cache unreachable" }
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - started,
        message: error instanceof Error ? error.message : "cache unreachable",
      }
    }
  }
}

export const dependencyHealthService = new DependencyHealthService()
