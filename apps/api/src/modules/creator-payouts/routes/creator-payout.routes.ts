import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { creatorPayoutController } from "../controllers/creator-payout.controller.js"

export const creatorPayoutsRouter: Router = Router()

creatorPayoutsRouter.post("/", requireAuth, creatorPayoutController.create)
creatorPayoutsRouter.get("/", requireAuth, creatorPayoutController.list)
creatorPayoutsRouter.get("/:id", requireAuth, creatorPayoutController.getById)
