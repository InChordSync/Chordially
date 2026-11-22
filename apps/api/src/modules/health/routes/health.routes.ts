import { Router } from "express"
import { deploymentProbesController } from "../controllers/deployment-probes.controller.js"

export const healthRouter: Router = Router()

healthRouter.get("/live", (_req, res) => {
  res.status(200).json(deploymentProbesController.getLivenessProbe())
})

healthRouter.get("/ready", async (_req, res, next) => {
  try {
    const readiness = await deploymentProbesController.getReadinessProbe()
    const statusCode = readiness.status === "ready" ? 200 : 503
    res.status(statusCode).json(readiness)
  } catch (error) {
    next(error)
  }
})
