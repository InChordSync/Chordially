import { Router } from "express"
import { authController } from "../controllers/auth.controller.js"

export const authRouter: Router = Router()

authRouter.post("/register", authController.register)
authRouter.post("/register-linked", authController.registerLinked)
authRouter.post("/login", authController.login)
