import express, { type Express } from "express"
import { activityRouter } from "./modules/activity/routes/activity.routes.js"
import { authRouter } from "./modules/auth/routes/auth.routes.js"
import { creatorPayoutsRouter } from "./modules/creator-payouts/routes/creator-payout.routes.js"
import { creatorsRouter } from "./modules/creators/routes/creator.routes.js"
import { fansRouter } from "./modules/fans/routes/fan.routes.js"
import { reconciliationRouter } from "./modules/reconciliation/routes/reconciliation.routes.js"
import { streamsRouter } from "./modules/streams/routes/stream.routes.js"
import { tipsRouter } from "./modules/tips/routes/tip.routes.js"
import { usersRouter } from "./modules/users/routes/user.routes.js"
import { walletRouter } from "./modules/wallet/routes/wallet.routes.js"
import { errorHandler } from "./shared/middleware/error-handler.js"
import { globalRateLimit } from "./shared/middleware/global-rate-limit.js"
import { openapiRouter } from "./modules/openapi/openapi.routes.js"
import { metricsRouter } from "./shared/metrics/metrics.routes.js"
import { healthRouter } from "./modules/health/routes/health.routes.js"
import { planningRouter } from "./modules/planning/routes/planning.routes.js"
import { notificationsRouter } from "./modules/notifications/routes/notification.routes.js"
import { devRouter } from "./modules/dev/routes/dev.routes.js"
import { env } from "./shared/config/env.js"

export function createApp(): Express {
  const app = express()

  app.use(express.json({ limit: "256kb" }))

  app.use("/health", healthRouter)

  // App-wide IP-based throttle (defense-in-depth under the per-feature
  // limiters). Health probes and the metrics endpoint are exempt.
  app.use((req, res, next) => {
    if (req.path === "/health" || req.path.startsWith("/api/metrics")) {
      next()
      return
    }
    void globalRateLimit(req, res, next)
  })

  app.use("/api/auth", authRouter)
  app.use("/api/creators", creatorsRouter)
  app.use("/api/users", usersRouter)
  app.use("/api/fans", fansRouter)
  app.use("/api/activity", activityRouter)
  app.use("/api/wallet", walletRouter)
  app.use("/api/tips", tipsRouter)
  app.use("/api/streams", streamsRouter)
  app.use("/api/creator-payouts", creatorPayoutsRouter)
  app.use("/api/reconciliation", reconciliationRouter)
  app.use("/api/planning", planningRouter)
  app.use("/api/notifications", notificationsRouter)
  app.use("/api/metrics", metricsRouter)
  app.use("/api/docs", openapiRouter)

  // Dev-only local mock tooling: mounted only under NODE_ENV=development.
  if (env.NODE_ENV === "development") {
    app.use("/api/dev", devRouter)
  }

  app.use(errorHandler)

  return app
}
