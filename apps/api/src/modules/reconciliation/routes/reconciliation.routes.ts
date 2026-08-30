import { Router } from "express"
import { requireAuth, requireRole } from "../../../shared/middleware/auth.middleware.js"
import { reconciliationController } from "../controllers/reconciliation.controller.js"
import { reconciliationRunRateLimit } from "../middleware/reconciliation-rate-limit.js"

export const reconciliationRouter: Router = Router()

// Manual trigger, mainly for demos/ops; the scheduled loop in server.ts
// calls reconciliationService.run() on the same interval automatically.
// Operator-only (admin) by design, and rate-limited per admin so a stray
// script can't hammer actual reconciliation batches.
reconciliationRouter.post(
  "/run",
  requireAuth,
  requireRole(["admin"]),
  reconciliationRunRateLimit,
  reconciliationController.run
)
