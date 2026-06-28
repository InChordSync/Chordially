import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { followController } from "../controllers/follow.controller.js"

export const followRouter: Router = Router()

followRouter.post("/:creatorSlug", requireAuth, followController.follow)
followRouter.delete("/:creatorSlug", requireAuth, followController.unfollow)
