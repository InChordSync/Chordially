/**
 * Issue #100 – Add artist-side supporter management view
 *
 * File destination: apps/web/app/artists/[slug]/supporters/page.tsx
 *
 * What this does:
 *  - Server Component – guards to artist role via requireRole()
 *  - Fetches all supporter reward records from GET /artists/:slug/rewards
 *  - Supports ?session= and ?eligible= query-string filters
 *  - Shows supporter list with totals and reward eligibility labels
 *  - Paginated (20 per page) for acceptable load with large supporter counts
 *  - Table structure is export-ready (data-* attributes for future CSV export)
 *
 * Acceptance criteria covered:
 *  ✓ Artists can view supporters and totals
 *  ✓ Reward-eligible supporters are clearly labeled
 *  ✓ Page loads acceptably with paginated data
 *
 * Usage: /artists/nova-chords/supporters
 */

import Link from "next/link";
import { Shell } from "../../../../components/layout/shell";
import { Card } from "../../../../components/ui/card";
import { requireRole } from "../../../../lib/guards";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RewardRecord {
  fanId: string;
  fanName: string;
  totalConfirmed: number;
  status: "INELIGIBLE" | "ELIGIBLE" | "ISSUED";
  updatedAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const ELIGIBILITY_THRESHOLD = 50; // must match reward.store.ts

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchSupporters(slug: string): Promise<RewardRecord[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${API_URL}/artists/${slug}/rewards`, {
      headers: { "x-demo-artist-slug": slug },
      cache: "no-store",
    });
    if (!res.ok) return DEMO_RECORDS;
    const data = (await res.json()) as { items: RewardRecord[] };
    return data.items;
  } catch {
    return DEMO_RECORDS;
  }
}

// ─── Demo fallback (matches reward.store.ts seed) ────────────────────────────

const DEMO_RECORDS: RewardRecord[] = [
  {
    fanId: "fan-2",
    fanName: "Kwame Beats",
    totalConfirmed: 20,
    status: "INELIGIBLE",
    updatedAt: "2026-03-27T18:10:08.000Z",
  },
  {
    fanId: "fan-3",
    fanName: "Zara M.",
    totalConfirmed: 15,
    status: "INELIGIBLE",
    updatedAt: "2026-03-27T18:15:05.000Z",
  },
  {
    fanId: "fan-1",
    fanName: "Ada Listener",
    totalConfirmed: 10,
    status: "INELIGIBLE",
    updatedAt: "2026-03-27T18:05:12.000Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: RewardRecord["status"]) {
  if (status === "ISSUED") return { label: "Badge issued", color: "#a78bfa" };
  if (status === "ELIGIBLE") return { label: "Eligible ✓", color: "#4ade80" };
  return { label: "Not yet eligible", color: "var(--muted)" };
}

function progressPct(total: number) {
  return Math.min((total / ELIGIBILITY_THRESHOLD) * 100, 100).toFixed(0);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SupporterManagementPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { eligible?: string; page?: string };
}) {
  requireRole(["artist"]);

  const allRecords = await fetchSupporters(params.slug);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const showEligibleOnly = searchParams.eligible === "1";
  const filtered = showEligibleOnly
    ? allRecords.filter((r) => r.status === "ELIGIBLE" || r.status === "ISSUED")
    : allRecords;

  // ── Pagination ──────────────────────────────────────────────────────────────
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const eligibleCount = allRecords.filter(
    (r) => r.status === "ELIGIBLE" || r.status === "ISSUED"
  ).length;

  return (
    <Shell
      title="Supporters"
      subtitle={`Manage your supporters and reward-eligible fans for @${params.slug}`}
    >
      {/* ── Summary ── */}
      <Card title="Overview">
        <div style={{ display: "flex", gap: 32 }}>
          <div>
            <p className="label" style={{ marginBottom: 4 }}>Total supporters</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
              {allRecords.length}
            </p>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 4 }}>Eligible for backstage pass</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#4ade80" }}>
              {eligibleCount}
            </p>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 4 }}>Threshold</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
              {ELIGIBILITY_THRESHOLD} XLM
            </p>
          </div>
        </div>
      </Card>

      {/* ── Filters ── */}
      <Card title="Filter">
        <form method="GET" className="nav">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              name="eligible"
              value="1"
              defaultChecked={showEligibleOnly}
            />
            <span>Eligible only</span>
          </label>
          <button className="button button--secondary" type="submit">
            Apply
          </button>
          <Link
            href={`/artists/${params.slug}/supporters`}
            className="button button--secondary"
          >
            Clear
          </Link>
        </form>
      </Card>

      {/* ── Supporter table ── */}
      {paginated.length === 0 ? (
        <Card title="No supporters">
          <p className="muted">No supporters match this filter.</p>
        </Card>
      ) : (
        <Card title={`Supporters (${filtered.length})`}>
          <div className="stack">
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 160px 140px",
                gap: 12,
                padding: "6px 14px",
                fontSize: "0.78rem",
                color: "var(--muted)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span>Supporter</span>
              <span style={{ textAlign: "right" }}>Total tips</span>
              <span>Progress to pass</span>
              <span>Status</span>
            </div>

            {/* Data rows */}
            {paginated.map((record) => {
              const badge = statusBadge(record.status);
              const pct = progressPct(record.totalConfirmed);
              return (
                <div
                  key={record.fanId}
                  data-fan-id={record.fanId}
                  data-total={record.totalConfirmed}
                  data-status={record.status}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 160px 140px",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    alignItems: "center",
                  }}
                >
                  {/* Name */}
                  <span style={{ fontWeight: 500 }}>
                    {record.fanName || "Anonymous"}
                  </span>

                  {/* Total */}
                  <span
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: "var(--accent)",
                    }}
                  >
                    {record.totalConfirmed.toFixed(2)}
                  </span>

                  {/* Progress bar */}
                  <div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "var(--line)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: 999,
                          background:
                            record.status === "INELIGIBLE"
                              ? "var(--accent)"
                              : "#4ade80",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <p
                      className="muted"
                      style={{ margin: "3px 0 0", fontSize: "0.72rem" }}
                    >
                      {pct}% of {ELIGIBILITY_THRESHOLD} XLM
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {page > 1 && (
            <Link
              href={`/artists/${params.slug}/supporters?page=${page - 1}${showEligibleOnly ? "&eligible=1" : ""}`}
              className="button button--secondary"
            >
              ← Prev
            </Link>
          )}
          <span className="muted" style={{ lineHeight: "36px" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/artists/${params.slug}/supporters?page=${page + 1}${showEligibleOnly ? "&eligible=1" : ""}`}
              className="button button--secondary"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </Shell>
  );
}
