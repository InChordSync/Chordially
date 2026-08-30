import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { fanController } from "../controllers/fan.controller.js"

export const fansRouter: Router = Router()

fansRouter.get("/me", requireAuth, fanController.getMe)
fansRouter.patch("/me", requireAuth, fanController.updateMe)
fansRouter.get("/me/bookmarks", requireAuth, fanController.listBookmarks)
fansRouter.post("/me/bookmarks", requireAuth, fanController.createBookmark)
fansRouter.delete("/me/bookmarks/:creatorId", requireAuth, fanController.deleteBookmark)
