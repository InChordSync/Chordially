/**
 * Issue #78 – Add moderation flags and artist/session reporting flow
 * Issue #79 – Build admin moderation queue for reported content
 *
 * File destination: apps/api/src/modules/reports/report.routes.ts
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { reportRouter } from "./reports/report.routes.js";
 *   app.use("/reports", reportRouter);
 *
 * Endpoints:
 *   POST /reports              – authenticated user submits a report
 *   GET  /reports              – admin reviews open reports (requireAdmin)
 *   PATCH /reports/:id/resolve – admin resolves a report (requireAdmin)
 *
 * Acceptance criteria covered:
 *  ✓ Users can submit reports from web pages
 *  ✓ Duplicate/spam reports are deduplicated per reporter+target
 *  ✓ Admins can review open reports
 *  ✓ Resolutions are persisted and auditable
 */

import { Router } from "express";
import { requireAuth } from "../apps/api/src/modules/auth/auth.middleware.js";
import {
  createReport,
  getReports,
  resolveReport,
  type ReportTargetType,
  type ReportReason,
  type ReportStatus,
} from "./report-store.js";

export const reportRouter = Router();

// ─── Middleware: admin-only guard ─────────────────────────────────────────────

function requireAdmin(req: any, res: any, next: any) {
  if (!req.authUser || req.authUser.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

// ─── POST /reports ────────────────────────────────────────────────────────────
// Authenticated user submits a report against an artist profile or session.
// Body: { targetType, targetId, targetLabel, reason, notes? }

const VALID_TARGET_TYPES: ReportTargetType[] = ["ARTIST_PROFILE", "SESSION"];
const VALID_REASONS: ReportReason[] = [
  "SPAM",
  "HARASSMENT",
  "INAPPROPRIATE_CONTENT",
  "FAKE_ACCOUNT",
  "OTHER",
];

reportRouter.post("/reports", requireAuth, (req, res) => {
  const user = req.authUser!;
  const { targetType, targetId, targetLabel, reason, notes } = req.body ?? {};

  if (!VALID_TARGET_TYPES.includes(targetType)) {
    res.status(400).json({ error: "Invalid targetType" });
    return;
  }

  if (!targetId || typeof targetId !== "string") {
    res.status(400).json({ error: "targetId is required" });
    return;
  }

  if (!targetLabel || typeof targetLabel !== "string") {
    res.status(400).json({ error: "targetLabel is required" });
    return;
  }

  if (!VALID_REASONS.includes(reason)) {
    res.status(400).json({ error: "Invalid reason" });
    return;
  }

  const report = createReport({
    reporterId: user.id,
    reporterName: user.username,
    targetType,
    targetId,
    targetLabel,
    reason,
    notes: notes ?? undefined,
  });

  if (!report) {
    // Duplicate – silently accept to avoid confirming whether target was reported
    res.status(200).json({ status: "received" });
    return;
  }

  res.status(201).json(report);
});

// ─── GET /reports ─────────────────────────────────────────────────────────────
// Admin views open reports. Optional ?status= and ?targetType= filters.

reportRouter.get("/reports", requireAuth, requireAdmin, (req, res) => {
  const { status, targetType } = req.query as {
    status?: string;
    targetType?: string;
  };

  const validStatuses: ReportStatus[] = [
    "OPEN",
    "DISMISSED",
    "WARNED",
    "DEACTIVATED",
  ];
  const reportStatus =
    status && validStatuses.includes(status as ReportStatus)
      ? (status as ReportStatus)
      : "OPEN";

  const reportTargetType =
    targetType && VALID_TARGET_TYPES.includes(targetType as ReportTargetType)
      ? (targetType as ReportTargetType)
      : undefined;

  const items = getReports({ status: reportStatus, targetType: reportTargetType });

  res.json({ items, total: items.length });
});

// ─── PATCH /reports/:id/resolve ───────────────────────────────────────────────
// Admin resolves a report with a resolution: DISMISSED | WARNED | DEACTIVATED

reportRouter.patch("/reports/:id/resolve", requireAuth, requireAdmin, (req, res) => {
  const admin = req.authUser!;
  const { id } = req.params;
  const { resolution } = req.body ?? {};

  const validResolutions: Exclude<ReportStatus, "OPEN">[] = [
    "DISMISSED",
    "WARNED",
    "DEACTIVATED",
  ];

  if (!validResolutions.includes(resolution)) {
    res.status(400).json({ error: "resolution must be DISMISSED, WARNED, or DEACTIVATED" });
    return;
  }

  const updated = resolveReport({
    reportId: id,
    resolution,
    resolvedById: admin.id,
  });

  if (!updated) {
    res.status(404).json({ error: "Report not found or already resolved" });
    return;
  }

  res.json(updated);
});
