import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { depositController } from "../controllers/deposit.controller.js"
import { walletController } from "../controllers/wallet.controller.js"

export const walletRouter: Router = Router()

walletRouter.get("/link-challenge", walletController.getLinkChallenge)
walletRouter.get("/me", requireAuth, walletController.getMe)
walletRouter.post("/usdc-trustline", requireAuth, walletController.establishUsdcTrustline)
walletRouter.post("/deposits", requireAuth, depositController.create)
walletRouter.get("/deposits", requireAuth, depositController.list)
walletRouter.get("/deposits/:id", requireAuth, depositController.getById)
