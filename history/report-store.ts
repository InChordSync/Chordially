/**
 * Issue #78 – Add moderation flags and artist/session reporting flow
 *
 * File destination: apps/api/src/modules/reports/report.store.ts
 *
 * What this does:
 *  - In-memory report store (mirrors the Report model in Prisma schema)
 *  - Tracks reports against artist profiles or sessions
 *  - Deduplicates: one OPEN report per (reporterId, targetType, targetId) combo
 *  - Exports query helpers used by report.routes.ts
 */

import crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportTargetType = "ARTIST_PROFILE" | "SESSION";
export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "INAPPROPRIATE_CONTENT"
  | "FAKE_ACCOUNT"
  | "OTHER";
export type ReportStatus = "OPEN" | "DISMISSED" | "WARNED" | "DEACTIVATED";

export interface StoredReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string; // human-readable target (artist name / session title)
  reason: ReportReason;
  notes?: string;
  status: ReportStatus;
  resolvedById?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const reports = new Map<string, StoredReport>();

// ─── Seed data ────────────────────────────────────────────────────────────────

function seed() {
  const seedReports: StoredReport[] = [
    {
      id: "report-1",
      reporterId: "fan-2",
      reporterName: "Kwame Beats",
      targetType: "ARTIST_PROFILE",
      targetId: "artist-3",
      targetLabel: "Midnight Strings",
      reason: "SPAM",
      notes: "Keeps posting unrelated promotional links in session chat.",
      status: "OPEN",
      createdAt: "2026-03-28T09:10:00.000Z",
    },
    {
      id: "report-2",
      reporterId: "fan-3",
      reporterName: "Zara M.",
      targetType: "SESSION",
      targetId: "sess-2",
      targetLabel: "Percussion & Brass Jam",
      reason: "INAPPROPRIATE_CONTENT",
      notes: "Session cover image is offensive.",
      status: "OPEN",
      createdAt: "2026-03-28T10:45:00.000Z",
    },
    {
      id: "report-3",
      reporterId: "fan-1",
      reporterName: "Ada Listener",
      targetType: "ARTIST_PROFILE",
      targetId: "artist-2",
      targetLabel: "Street Tempo",
      reason: "FAKE_ACCOUNT",
      status: "DISMISSED",
      resolvedById: "admin-1",
      resolvedAt: "2026-03-28T11:00:00.000Z",
      createdAt: "2026-03-27T20:00:00.000Z",
    },
  ];

  for (const report of seedReports) {
    reports.set(report.id, report);
  }
}

seed();

// ─── Query helpers ────────────────────────────────────────────────────────────

export interface CreateReportInput {
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  notes?: string;
}

/**
 * Create a report. Returns null if an OPEN report already exists for the same
 * (reporterId, targetType, targetId) combination (deduplication).
 */
export function createReport(input: CreateReportInput): StoredReport | null {
  // Deduplicate – one open report per reporter+target
  const duplicate = [...reports.values()].find(
    (r) =>
      r.reporterId === input.reporterId &&
      r.targetType === input.targetType &&
      r.targetId === input.targetId &&
      r.status === "OPEN"
  );

  if (duplicate) return null;

  const report: StoredReport = {
    ...input,
    id: crypto.randomUUID(),
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };

  reports.set(report.id, report);
  return report;
}

export interface GetReportsQuery {
  status?: ReportStatus;
  targetType?: ReportTargetType;
}

/** Return reports, newest first. Defaults to open reports only. */
export function getReports(query: GetReportsQuery = {}): StoredReport[] {
  const status = query.status ?? "OPEN";
  return [...reports.values()]
    .filter((r) => {
      if (r.status !== status) return false;
      if (query.targetType && r.targetType !== query.targetType) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface ResolveReportInput {
  reportId: string;
  resolution: Exclude<ReportStatus, "OPEN">;
  resolvedById: string;
}

/** Resolve a report. Returns null if report not found or already resolved. */
export function resolveReport(input: ResolveReportInput): StoredReport | null {
  const report = reports.get(input.reportId);
  if (!report || report.status !== "OPEN") return null;

  report.status = input.resolution;
  report.resolvedById = input.resolvedById;
  report.resolvedAt = new Date().toISOString();
  return report;
}
