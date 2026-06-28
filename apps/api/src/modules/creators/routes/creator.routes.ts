import { Router } from "express"
import { requireAuth, requireOptionalAuth } from "../../../shared/middleware/auth.middleware.js"
import { creatorController } from "../controllers/creator.controller.js"

export const creatorsRouter: Router = Router()

creatorsRouter.get("/card/:slug", requireOptionalAuth, creatorController.getCard)
creatorsRouter.get("/:slug/followers", creatorController.getFollowers)
creatorsRouter.get("/:slug/follow-count", creatorController.getFollowCount)
creatorsRouter.get("/:slug/availability", creatorController.getAvailability)
creatorsRouter.get("/:slug", creatorController.getBySlug)
creatorsRouter.patch("/me", requireAuth, creatorController.patchMe)
creatorsRouter.patch("/me/tags", requireAuth, creatorController.updateTags)
creatorsRouter.patch("/me/availability", requireAuth, creatorController.updateAvailability)
creatorsRouter.post("/me/activity-ping", requireAuth, creatorController.activityPing)
