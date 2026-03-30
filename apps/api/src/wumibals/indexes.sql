-- Performance indexes for sessions and tips query patterns

-- Session: filter by status with sort on startedAt (live session leaderboards)
CREATE INDEX "Session_status_startedAt_idx" ON "Session"("status", "startedAt");

-- Session: sort by most-tipped within a status window
CREATE INDEX "Session_status_totalTipsAmount_idx" ON "Session"("status", "totalTipsAmount" DESC);

-- Tip: look up confirmed tips by wallet for payout reconciliation
CREATE INDEX "Tip_walletId_status_idx" ON "Tip"("walletId", "status");

-- Tip: find all confirmed tips within a date range (revenue reports)
CREATE INDEX "Tip_status_confirmedAt_idx" ON "Tip"("status", "confirmedAt");

-- Tip: deduplication and ledger lookup by txHash (partial — only non-null rows)
CREATE INDEX "Tip_txHash_partial_idx" ON "Tip"("txHash") WHERE "txHash" IS NOT NULL;
