import { Router } from "express"
import { discoveryController } from "../controllers/discovery.controller.js"

export const discoveryRouter: Router = Router()

discoveryRouter.get("/", discoveryController.discover)
