import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { walletController } from "../controllers/wallet.controller.js"

export const walletRouter: Router = Router()

walletRouter.get("/me", requireAuth, walletController.getMe)
walletRouter.post("/usdc-trustline", requireAuth, walletController.establishUsdcTrustline)
