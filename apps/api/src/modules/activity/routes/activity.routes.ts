import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { activityController } from "../controllers/activity.controller.js"

export const activityRouter: Router = Router()

activityRouter.get("/stream", requireAuth, activityController.list)
