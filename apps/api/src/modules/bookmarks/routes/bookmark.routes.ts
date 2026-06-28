import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { bookmarkController } from "../controllers/bookmark.controller.js"

export const bookmarkRouter: Router = Router()

bookmarkRouter.post("/:creatorSlug", requireAuth, bookmarkController.bookmark)
bookmarkRouter.delete("/:creatorSlug", requireAuth, bookmarkController.removeBookmark)
