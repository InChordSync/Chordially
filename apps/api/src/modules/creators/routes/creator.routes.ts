import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { creatorController } from "../controllers/creator.controller.js"
import { mediaOrderController } from "../controllers/media-order.controller.js"
import { trendingController } from "../controllers/trending.controller.js"

export const creatorsRouter: Router = Router()

// /search must be registered before /:slug or it would be swallowed as a slug.
creatorsRouter.get("/search", creatorController.getSearch)
creatorsRouter.get("/:slug", creatorController.getBySlug)
creatorsRouter.patch("/:slug/media-order", requireAuth, mediaOrderController.updateMediaOrder)
