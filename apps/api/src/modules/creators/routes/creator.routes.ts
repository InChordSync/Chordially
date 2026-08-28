import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { creatorController } from "../controllers/creator.controller.js"
import { mediaOrderController } from "../controllers/media-order.controller.js"
import { trendingController } from "../controllers/trending.controller.js"

export const creatorsRouter: Router = Router()

creatorsRouter.get("/trending", trendingController.getTrending)
creatorsRouter.get("/:slug", creatorController.getBySlug)
creatorsRouter.patch("/:slug/media-order", requireAuth, mediaOrderController.updateMediaOrder)
