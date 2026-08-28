import { Router } from "express"
import { creatorController } from "../controllers/creator.controller.js"

export const creatorsRouter: Router = Router()

// /search must be registered before /:slug or it would be swallowed as a slug.
creatorsRouter.get("/search", creatorController.getSearch)
creatorsRouter.get("/:slug", creatorController.getBySlug)
