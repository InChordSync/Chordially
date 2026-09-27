import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { tipController } from "../controllers/tip.controller.js"

export const tipsRouter: Router = Router()

tipsRouter.post("/", requireAuth, tipController.create)
tipsRouter.get("/:id", requireAuth, tipController.getById)
tipsRouter.post("/:id/retry", requireAuth, tipController.retry)
tipsRouter.post("/:id/submit-signed", requireAuth, tipController.submitSigned)
