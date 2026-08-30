import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { planningController } from "../controllers/planning.controller.js"

export const planningRouter: Router = Router()

// Authenticated admin-only export endpoint for the sprint snapshot writer
// (previously dead code with no HTTP surface).
planningRouter.post("/sprint-snapshot", requireAuth, planningController.exportSprintSnapshot)
