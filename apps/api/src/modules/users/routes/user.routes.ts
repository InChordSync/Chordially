import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { userController } from "../controllers/user.controller.js"

export const usersRouter: Router = Router()

usersRouter.get("/me", requireAuth, userController.getMe)
usersRouter.get("/me/onboarding", requireAuth, userController.getOnboarding)
usersRouter.get("/me/onboarding/resume", requireAuth, userController.getOnboardingResume)
usersRouter.post("/me/onboarding/step/:stepKey/complete", requireAuth, userController.markOnboardingStepComplete)
usersRouter.patch("/me", requireAuth, userController.patchMe)
usersRouter.post("/me/upload-url", requireAuth, userController.getUploadUrl)
usersRouter.get("/me/following", requireAuth, userController.getFollowing)
usersRouter.get("/me/bookmarks", requireAuth, userController.getBookmarks)
