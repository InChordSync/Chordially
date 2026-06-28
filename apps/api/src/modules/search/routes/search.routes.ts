import { Router } from "express"
import { searchController } from "../controllers/search.controller.js"

export const searchRouter: Router = Router()

searchRouter.get("/", searchController.search)
