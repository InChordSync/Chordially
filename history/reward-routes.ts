/**
 * Issue #99 – Build reward eligibility tracking in the backend
 *
 * File destination: apps/api/src/modules/rewards/reward.routes.ts
 *
 * Endpoints:
 *   GET /artists/:slug/rewards              – all reward records for an artist (requireAuth artist role)
 *   GET /artists/:slug/rewards/eligible     – only eligible/issued supporters (requireAuth artist role)
 *   POST /artists/:slug/rewards/:fanId/issue – mark badge as issued (requireAuth artist role)
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { rewardRouter } from "./rewards/reward.routes.js";
 *   app.use("/", rewardRouter);
 */

import { Router } from "express";
import { requireAuth } from "../apps/api/src/modules/auth/auth.middleware.js";
import {
  getRewardsByArtist,
  getEligibleSupporters,
  markBadgeIssued,
} from "./reward-store.js";

export const rewardRouter = Router();

// ─── GET /artists/:slug/rewards ───────────────────────────────────────────────
// Returns all reward records for an artist (all supporters, any status).

rewardRouter.get("/artists/:slug/rewards", requireAuth, (req, res) => {
  const { slug } = req.params;
  const records = getRewardsByArtist(slug);
  res.json({ items: records, total: records.length });
});

// ─── GET /artists/:slug/rewards/eligible ──────────────────────────────────────
// Returns only ELIGIBLE or ISSUED supporters for an artist.

rewardRouter.get("/artists/:slug/rewards/eligible", requireAuth, (req, res) => {
  const { slug } = req.params;
  const records = getEligibleSupporters(slug);
  res.json({ items: records, total: records.length });
});

// ─── POST /artists/:slug/rewards/:fanId/issue ─────────────────────────────────
// Marks a supporter's badge as issued.

rewardRouter.post(
  "/artists/:slug/rewards/:fanId/issue",
  requireAuth,
  (req, res) => {
    const { slug, fanId } = req.params;
    const record = markBadgeIssued(slug, fanId);
    if (!record) {
      res.status(404).json({ error: "Reward record not found." });
      return;
    }
    res.json(record);
  }
);
