import { Router } from "express"
import { requireAuth } from "../../../shared/middleware/auth.middleware.js"
import { streamController } from "../controllers/stream.controller.js"
import { streamPayoutConfigController } from "../controllers/stream-payout-config.controller.js"

export const streamsRouter: Router = Router()

streamsRouter.post("/", requireAuth, streamController.start)
streamsRouter.post("/:id/end", requireAuth, streamController.end)
// Tip feed is intentionally private: only an authenticated user may subscribe
// to a stream's live tip SSE stream.
streamsRouter.get("/:id/tips", requireAuth, streamController.streamTips)
streamsRouter.put("/:id/payout-config", requireAuth, streamPayoutConfigController.set)
streamsRouter.get("/:id/payout-config", requireAuth, streamPayoutConfigController.get)
