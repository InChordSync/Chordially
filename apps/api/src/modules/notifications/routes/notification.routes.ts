import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { notificationController } from "../controllers/notification.controller.js"

export const notificationsRouter: Router = Router()

notificationsRouter.get("/", requireAuth, notificationController.list)
notificationsRouter.post("/read-all", requireAuth, notificationController.markAllRead)
notificationsRouter.post("/:id/read", requireAuth, notificationController.markRead)
