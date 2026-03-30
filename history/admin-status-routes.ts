/**
 * Issue #80 – Add user and artist status management for admins
 *
 * File destination: apps/api/src/modules/admin/admin.routes.ts
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { adminRouter } from "./admin/admin.routes.js";
 *   app.use("/admin", adminRouter);
 *
 * Endpoints:
 *   GET  /admin/users                – list users with status (requireAdmin)
 *   PATCH /admin/users/:id/status    – update user status (requireAdmin)
 *   GET  /admin/artists              – list artist profiles (requireAdmin)
 *   PATCH /admin/artists/:id/status  – update artist status (requireAdmin)
 *   GET  /admin/audit                – status change audit log (requireAdmin)
 *
 * Acceptance criteria covered:
 *  ✓ Suspended users cannot perform restricted actions (enforced in requireAuth)
 *  ✓ Deactivated artists do not appear in discovery (filtered in artist search)
 *  ✓ All status changes are audited
 */

import { Router } from "express";
import { requireAuth } from "../apps/api/src/modules/auth/auth.middleware.js";
import {
  getUsers,
  setUserStatus,
  getArtists,
  setArtistStatus,
  getStatusAuditLog,
  type UserStatus,
} from "./admin-status-store.js";

export const adminRouter = Router();

// ─── Admin-only middleware ────────────────────────────────────────────────────

function requireAdmin(req: any, res: any, next: any) {
  if (!req.authUser || req.authUser.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

const VALID_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

// ─── GET /admin/users ─────────────────────────────────────────────────────────
// Lists all users with their current status.
// Query params: role (fan|artist|admin), status (ACTIVE|SUSPENDED|DEACTIVATED)

adminRouter.get("/admin/users", requireAuth, requireAdmin, (req, res) => {
  const { role, status } = req.query as { role?: string; status?: string };

  const validRoles = ["fan", "artist", "admin"];
  const userRole = role && validRoles.includes(role) ? (role as any) : undefined;
  const userStatus =
    status && VALID_STATUSES.includes(status as UserStatus)
      ? (status as UserStatus)
      : undefined;

  const users = getUsers({ role: userRole, status: userStatus });
  res.json({ items: users, total: users.length });
});

// ─── PATCH /admin/users/:id/status ───────────────────────────────────────────
// Update a user's status.  Body: { status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" }

adminRouter.patch("/admin/users/:id/status", requireAuth, requireAdmin, (req, res) => {
  const admin = req.authUser!;
  const { id } = req.params;
  const { status } = req.body ?? {};

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: "status must be ACTIVE, SUSPENDED, or DEACTIVATED" });
    return;
  }

  const updated = setUserStatus(id, status as UserStatus, admin.id);

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updated);
});

// ─── GET /admin/artists ───────────────────────────────────────────────────────
// Lists all artist profiles with their current status.
// Query params: status, city

adminRouter.get("/admin/artists", requireAuth, requireAdmin, (req, res) => {
  const { status, city } = req.query as { status?: string; city?: string };

  const artistStatus =
    status && VALID_STATUSES.includes(status as UserStatus)
      ? (status as UserStatus)
      : undefined;

  const artists = getArtists({ status: artistStatus, city });
  res.json({ items: artists, total: artists.length });
});

// ─── PATCH /admin/artists/:id/status ─────────────────────────────────────────
// Update an artist profile's status.

adminRouter.patch("/admin/artists/:id/status", requireAuth, requireAdmin, (req, res) => {
  const admin = req.authUser!;
  const { id } = req.params;
  const { status } = req.body ?? {};

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: "status must be ACTIVE, SUSPENDED, or DEACTIVATED" });
    return;
  }

  const updated = setArtistStatus(id, status as UserStatus, admin.id);

  if (!updated) {
    res.status(404).json({ error: "Artist profile not found" });
    return;
  }

  res.json(updated);
});

// ─── GET /admin/audit ─────────────────────────────────────────────────────────
// Returns the status change audit log, newest first.

adminRouter.get("/admin/audit", requireAuth, requireAdmin, (req, res) => {
  const log = getStatusAuditLog();
  res.json({ items: log, total: log.length });
});
