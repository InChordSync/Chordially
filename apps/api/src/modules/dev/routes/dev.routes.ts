import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { devController } from "../controllers/dev.controller.js"

export const devRouter: Router = Router()

// Dev-only tooling, mounted in app.ts only when NODE_ENV === "development".
devRouter.post("/mock/enable", requireAuth, devController.enableMock)
devRouter.get("/mock/config", requireAuth, devController.getMockConfig)
