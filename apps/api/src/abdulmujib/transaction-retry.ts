/**
 * Background retry service for stale pending tip transactions.
 *
 * Periodically scans all pending transactions, attempts to re-verify or
 * re-submit them, and applies an exponential backoff. Transactions that
 * exceed MAX_ATTEMPTS are marked as permanently failed so they no longer
 * consume retry budget.
 */

const MAX_ATTEMPTS = 5;
const CHECK_INTERVAL_MS = 60_000; // 1 minute

type TxStatus = "pending" | "confirmed" | "failed";

interface PendingTransaction {
  id: string;
  destination: string;
  amount: string;
  asset: "XLM" | "USDC";
  attempts: number;
  createdAt: number;
  status: TxStatus;
  lastAttemptAt?: number;
}

// In-memory store — replace with DB queries (Prisma) when persistence layer is ready
const store = new Map<string, PendingTransaction>();

export function addPendingTransaction(tx: Omit<PendingTransaction, "attempts" | "status" | "createdAt">) {
  store.set(tx.id, {
    ...tx,
    attempts: 0,
    status: "pending",
    createdAt: Date.now(),
  });
}

export function getPendingTransactions(): PendingTransaction[] {
  return [...store.values()].filter((tx) => tx.status === "pending");
}

export function getRetriedTransactions(): PendingTransaction[] {
  return [...store.values()].filter((tx) => tx.attempts > 0);
}

// Placeholder verifier — replace with real Stellar horizon check
async function verifyOnChain(tx: PendingTransaction): Promise<boolean> {
  // Simulate a successful on-chain confirmation ~60% of the time
  return Math.random() > 0.4;
}

async function retryTransaction(tx: PendingTransaction): Promise<void> {
  const backoffMs = Math.min(1000 * 2 ** tx.attempts, 32_000);
  const nextAllowedAt = (tx.lastAttemptAt ?? tx.createdAt) + backoffMs;

  if (Date.now() < nextAllowedAt) return; // not yet due

  tx.attempts += 1;
  tx.lastAttemptAt = Date.now();

  try {
    const confirmed = await verifyOnChain(tx);
    if (confirmed) {
      tx.status = "confirmed";
      console.log(`[retry] tx ${tx.id} confirmed after ${tx.attempts} attempt(s)`);
    } else if (tx.attempts >= MAX_ATTEMPTS) {
      tx.status = "failed";
      console.warn(`[retry] tx ${tx.id} permanently failed after ${tx.attempts} attempt(s)`);
    }
  } catch (err) {
    console.error(`[retry] tx ${tx.id} error on attempt ${tx.attempts}:`, err);
    if (tx.attempts >= MAX_ATTEMPTS) {
      tx.status = "failed";
    }
  }

  store.set(tx.id, tx);
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startRetryWorker(): void {
  if (intervalHandle) return; // already running
  console.log("[retry] worker started");

  intervalHandle = setInterval(async () => {
    const pending = getPendingTransactions();
    if (pending.length === 0) return;
    console.log(`[retry] checking ${pending.length} pending transaction(s)`);
    await Promise.allSettled(pending.map(retryTransaction));
  }, CHECK_INTERVAL_MS);
}

export function stopRetryWorker(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[retry] worker stopped");
  }
}
