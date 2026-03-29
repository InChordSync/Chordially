/**
 * Issue #99 – Build reward eligibility tracking in the backend
 *
 * File destination: apps/api/src/modules/rewards/reward.store.ts
 *
 * What this does:
 *  - Computes supporter eligibility from confirmed tip totals (deterministic)
 *  - Persists reward status per artist-supporter pair in-memory store
 *  - Updates eligibility after tip confirmations
 *  - Works independently of NFT minting (minting is deferred)
 *
 * Eligibility threshold: 50 XLM-equivalent confirmed tips per artist
 * (XLM and USDC are treated as 1:1 for demo purposes)
 *
 * Acceptance criteria covered:
 *  ✓ Eligible supporters are computed deterministically
 *  ✓ Supporter reward state updates after tip confirmations
 *  ✓ Feature works even if NFT minting is not yet enabled
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RewardStatus = "INELIGIBLE" | "ELIGIBLE" | "ISSUED";

export interface RewardRecord {
  artistSlug: string;
  fanId: string;
  fanName: string;
  totalConfirmed: number; // sum of confirmed tip amounts for this artist
  status: RewardStatus;
  updatedAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

/** Minimum confirmed tip total (in XLM-equivalent) to qualify for a backstage pass */
export const ELIGIBILITY_THRESHOLD = 50;

// ─── In-memory store ──────────────────────────────────────────────────────────

// Key: `${artistSlug}::${fanId}`
const rewardStore = new Map<string, RewardRecord>();

function storeKey(artistSlug: string, fanId: string) {
  return `${artistSlug}::${fanId}`;
}

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Recompute and persist reward status for a (artist, fan) pair.
 * Called after every tip confirmation.
 *
 * @param artistSlug  - artist identifier
 * @param fanId       - fan identifier
 * @param fanName     - display name (latest value wins)
 * @param totalAmount - current cumulative confirmed tip total for this artist
 */
export function updateRewardStatus(
  artistSlug: string,
  fanId: string,
  fanName: string,
  totalAmount: number
): RewardRecord {
  const key = storeKey(artistSlug, fanId);
  const existing = rewardStore.get(key);

  // Never downgrade an already-issued badge
  const currentStatus = existing?.status ?? "INELIGIBLE";
  const newStatus: RewardStatus =
    currentStatus === "ISSUED"
      ? "ISSUED"
      : totalAmount >= ELIGIBILITY_THRESHOLD
      ? "ELIGIBLE"
      : "INELIGIBLE";

  const record: RewardRecord = {
    artistSlug,
    fanId,
    fanName,
    totalConfirmed: totalAmount,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  rewardStore.set(key, record);
  return record;
}

/** Get reward status for a single (artist, fan) pair */
export function getRewardStatus(
  artistSlug: string,
  fanId: string
): RewardRecord | null {
  return rewardStore.get(storeKey(artistSlug, fanId)) ?? null;
}

/** Get all reward records for an artist, sorted by totalConfirmed desc */
export function getRewardsByArtist(artistSlug: string): RewardRecord[] {
  return [...rewardStore.values()]
    .filter((r) => r.artistSlug === artistSlug)
    .sort((a, b) => b.totalConfirmed - a.totalConfirmed);
}

/** Get only eligible (or issued) supporters for an artist */
export function getEligibleSupporters(artistSlug: string): RewardRecord[] {
  return getRewardsByArtist(artistSlug).filter(
    (r) => r.status === "ELIGIBLE" || r.status === "ISSUED"
  );
}

/** Mark a badge as issued (called after minting or manual grant) */
export function markBadgeIssued(
  artistSlug: string,
  fanId: string
): RewardRecord | null {
  const key = storeKey(artistSlug, fanId);
  const record = rewardStore.get(key);
  if (!record) return null;
  record.status = "ISSUED";
  record.updatedAt = new Date().toISOString();
  return record;
}

// ─── Seed (mirrors tip.store.ts confirmed tips) ───────────────────────────────

function seed() {
  // nova-chords / sess-1 confirmed tips:
  //   fan-1 (Ada Listener):  10 XLM  → INELIGIBLE
  //   fan-2 (Kwame Beats):   20 XLM  → INELIGIBLE
  //   fan-3 (Zara M.):       15 XLM  → INELIGIBLE
  // street-tempo / sess-2 confirmed tips:
  //   fan-1 (Ada Listener):   5 USDC → INELIGIBLE
  //   fan-2 (Kwame Beats):    8 USDC → INELIGIBLE

  const seedData: Array<[string, string, string, number]> = [
    ["nova-chords", "fan-1", "Ada Listener", 10],
    ["nova-chords", "fan-2", "Kwame Beats", 20],
    ["nova-chords", "fan-3", "Zara M.", 15],
    ["street-tempo", "fan-1", "Ada Listener", 5],
    ["street-tempo", "fan-2", "Kwame Beats", 8],
  ];

  for (const [artistSlug, fanId, fanName, total] of seedData) {
    updateRewardStatus(artistSlug, fanId, fanName, total);
  }
}

seed();
