import { Router } from "express"
import { authController } from "../controllers/auth.controller.js"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"

export const authRouter: Router = Router()

authRouter.post("/register", authController.register)
authRouter.post("/register-linked", authController.registerLinked)
authRouter.post("/login", authController.login)
authRouter.post("/refresh", authController.refresh)
authRouter.post("/logout", requireAuth, authController.logout)
authRouter.post("/forgot-password", authController.forgotPassword)
authRouter.post("/reset-password", authController.resetPassword)
authRouter.post("/verify-email", authController.verifyEmail)
authRouter.post("/email-verification", requireAuth, authController.createEmailVerification)
