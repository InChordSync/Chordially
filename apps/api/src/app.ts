import express from "express"

/**
 * The Express instance handed to Nest's ExpressAdapter. Keeping body parsing
 * here (instead of relying on Nest) also gives webhook guards access to the
 * exact raw bytes that were signed via `req.rawBody`.
 */
export function createApp() {
  const app = express()

  app.use(express.json({
    limit: "1mb",
    verify: (req, _res, buffer) => {
      (req as any).rawBody = Buffer.from(buffer)
    },
  }))
  app.use(express.urlencoded({ extended: true }))

  return app
}
