import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { rateLimitByIp } from "../../../shared/rate-limit/rate-limit.middleware.js"
import { creatorController } from "../controllers/creator.controller.js"
import { mediaOrderController } from "../controllers/media-order.controller.js"
import { trendingController } from "../controllers/trending.controller.js"
import { creatorProfileRateLimiter } from "../services/creator-routes.rate-limiter.js"

export const creatorsRouter: Router = Router()

// /search must be registered before /:slug or it would be swallowed as a slug.
creatorsRouter.get("/search", creatorController.getSearch)
// Intentionally public (no auth), so it gets a lenient IP-based rate limiter
// to curb unauthenticated scraping/enumeration of the creator directory.
creatorsRouter.get(
  "/:slug",
  rateLimitByIp(creatorProfileRateLimiter, "Too many profile requests. Please try again shortly."),
  creatorController.getBySlug
)
creatorsRouter.patch("/:slug/media-order", requireAuth, mediaOrderController.updateMediaOrder)
