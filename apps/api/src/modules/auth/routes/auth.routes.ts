import { Router } from "express"
import { authController } from "../controllers/auth.controller.js"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { registerRateLimit } from "../middleware/auth-rate-limit.js"

export const authRouter: Router = Router()

authRouter.post("/register", registerRateLimit, authController.register)
authRouter.post("/register-linked", registerRateLimit, authController.registerLinked)
authRouter.post("/login", authController.login)
authRouter.post("/refresh", authController.refresh)
authRouter.post("/logout", requireAuth, authController.logout)
