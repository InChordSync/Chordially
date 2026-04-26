// CHORD-038: Admin audit and moderation event schemas
// Immutable snapshots of actor, target, action, reason, and metadata.

export type AuditAction =
  | "user.ban"
  | "user.unban"
  | "user.warn"
  | "content.remove"
  | "content.restore"
  | "tip.refund"
  | "badge.revoke"
  | "session.terminate";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditActor {
  userId: string;
  role: "admin" | "moderator" | "system";
  ip?: string;
}

export interface AuditTarget {
  type: "user" | "content" | "tip" | "session";
  id: string;
  /** Human-readable snapshot at time of action */
  snapshot?: Record<string, unknown>;
}

/** Primary document stored in `audit_events` collection. Append-only. */
export interface AuditEvent {
  _id: string;
  action: AuditAction;
  severity: AuditSeverity;
  actor: AuditActor;
  target: AuditTarget;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: Date; // immutable — never updated
}

// Indexes:
//   { createdAt: -1 }                    — time-ordered log reads
//   { "target.id": 1, createdAt: -1 }    — per-entity history
//   { "actor.userId": 1, createdAt: -1 } — per-admin activity

export function buildAuditEvent(
  action: AuditAction,
  actor: AuditActor,
  target: AuditTarget,
  reason: string,
  metadata?: Record<string, unknown>
): Omit<AuditEvent, "_id"> {
  const severity: AuditSeverity =
    action.endsWith(".ban") || action === "tip.refund" ? "critical"
    : action.endsWith(".warn") ? "warning"
    : "info";

  return { action, severity, actor, target, reason, metadata, createdAt: new Date() };
}
