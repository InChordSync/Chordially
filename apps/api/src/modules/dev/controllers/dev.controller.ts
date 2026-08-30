import type { NextFunction, Request, Response } from "express"
import { localMockApiServerService } from "../services/local-mock-api-server.service.js"

export const devController = {
  // Enables the local mock mode (dev-only tooling).
  enableMock(_req: Request, res: Response, next: NextFunction): void {
    try {
      localMockApiServerService.enableMockMode()
      res.status(200).json(localMockApiServerService.getConfig())
    } catch (error) {
      next(error)
    }
  },

  getMockConfig(_req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(localMockApiServerService.getConfig())
    } catch (error) {
      next(error)
    }
  },
}
