import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { creatorPayoutController } from "../controllers/creator-payout.controller.js"
import { creatorPayoutRateLimit } from "../middleware/creator-payout-rate-limit.js"

export const creatorPayoutsRouter: Router = Router()

creatorPayoutsRouter.post("/", requireAuth, creatorPayoutRateLimit, creatorPayoutController.create)
creatorPayoutsRouter.get("/", requireAuth, creatorPayoutController.list)
creatorPayoutsRouter.get("/:id", requireAuth, creatorPayoutController.getById)
