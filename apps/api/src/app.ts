import express, { type Express } from "express"
import { authRouter } from "./modules/auth/routes/auth.routes.js"
import { creatorPayoutsRouter } from "./modules/creator-payouts/routes/creator-payout.routes.js"
import { creatorsRouter } from "./modules/creators/routes/creator.routes.js"
import { reconciliationRouter } from "./modules/reconciliation/routes/reconciliation.routes.js"
import { streamsRouter } from "./modules/streams/routes/stream.routes.js"
import { tipsRouter } from "./modules/tips/routes/tip.routes.js"
import { usersRouter } from "./modules/users/routes/user.routes.js"
import { walletRouter } from "./modules/wallet/routes/wallet.routes.js"
import { errorHandler } from "./shared/middleware/error-handler.js"
import { metricsRouter } from "./shared/metrics/metrics.routes.js"

export function createApp(): Express {
  const app = express()

  app.use(express.json())

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" })
  })

  app.use("/api/auth", authRouter)
  app.use("/api/creators", creatorsRouter)
  app.use("/api/users", usersRouter)
  app.use("/api/wallet", walletRouter)
  app.use("/api/tips", tipsRouter)
  app.use("/api/streams", streamsRouter)
  app.use("/api/creator-payouts", creatorPayoutsRouter)
  app.use("/api/reconciliation", reconciliationRouter)
  app.use("/api/metrics", metricsRouter)

  app.use(errorHandler)

  return app
}
