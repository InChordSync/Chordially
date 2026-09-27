import type { StellarAssetDescriptor, StellarPaymentRecord } from "@chordially/stellar"
import { creatorService } from "../../creators/services/creator.service.js"
import { publishTipEvent } from "../../tips/services/tip.service.js"
import { tipPayoutRepository } from "../../tips/repositories/tip-payout.repository.js"
import { tipRepository } from "../../tips/repositories/tip.repository.js"
import type { Tip } from "../../tips/types/tip.types.js"
import { walletRepository } from "../../wallet/repositories/wallet.repository.js"
import { env } from "../../../shared/config/env.js"
import { logger } from "../../../shared/logger/logger.js"
import { metrics } from "../../../shared/metrics/metrics.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { toAssetDescriptor, type TipAssetCode } from "../../../shared/stellar/assets.js"

export interface ReconciliationSummary {
  scanned: number
  confirmed: number
  deadLettered: number
  stillPending: number
}

type ReconcileOutcome = "confirmed" | "dead-lettered" | "pending"

const AMOUNT_TOLERANCE = 0.0000001
// A little slack before the tip's own updatedAt, in case the ledger's
// timestamp and this process's clock aren't perfectly in sync.
const LOOKBACK_BUFFER_MS = 60_000

function amountsMatch(a: string, b: string): boolean {
  return Math.abs(Number(a) - Number(b)) < AMOUNT_TOLERANCE
}

/**
 * A native and an issued asset can share a numeric amount and destination
 * by coincidence, so matching must check the asset too — otherwise a USDC
 * tip could be wrongly "confirmed" by an unrelated native payment.
 */
function paymentMatchesAsset(payment: StellarPaymentRecord, asset: StellarAssetDescriptor): boolean {
  if (asset.code === "native") {
    return payment.assetType === "native"
  }
  return payment.assetCode === asset.code && payment.assetIssuer === asset.issuer
}

interface ExpectedDestination {
  amount: string
  publicKey: string
}

/** Resolves each payee's wallet for a tip (single recipient, or every split payout). Null if any is missing. */
async function resolveExpectedDestinations(tip: Tip): Promise<ExpectedDestination[] | null> {
  const payouts = await tipPayoutRepository.findByTipId(tip.id)
  const targets =
    payouts.length > 0
      ? payouts.map((payout) => ({ creatorId: payout.creatorId, amount: payout.amount }))
      : [{ creatorId: tip.creatorId, amount: tip.amount }]

  const destinations: ExpectedDestination[] = []
  for (const target of targets) {
    const creator = await creatorService.findById(target.creatorId)
    const wallet = creator ? await walletRepository.findByUserId(creator.userId) : null
    if (!wallet) {
      return null
    }
    destinations.push({ amount: target.amount, publicKey: wallet.publicKey })
  }

  return destinations
}

async function finalizeAsConfirmed(tip: Tip, txHash: string): Promise<void> {
  const payouts = await tipPayoutRepository.findByTipId(tip.id)
  const isSplit = payouts.length > 0

  const confirmedTip = await tipRepository.markConfirmed(tip.id, txHash, tip.attempts)
  if (isSplit) {
    await tipPayoutRepository.markConfirmedForTip(tip.id, txHash)
  }
  const finalPayouts = isSplit ? await tipPayoutRepository.findByTipId(tip.id) : []

  publishTipEvent(confirmedTip, finalPayouts)
  logger.info("Reconciliation confirmed a stuck tip", { tipId: tip.id, txHash })
}

async function finalizeAsDeadLettered(tip: Tip, reason: string): Promise<void> {
  const payouts = await tipPayoutRepository.findByTipId(tip.id)
  const isSplit = payouts.length > 0

  const failedTip = await tipRepository.markFailed(tip.id, reason, tip.attempts)
  if (isSplit) {
    await tipPayoutRepository.markFailedForTip(tip.id, reason)
  }
  const finalPayouts = isSplit ? await tipPayoutRepository.findByTipId(tip.id) : []

  publishTipEvent(failedTip, finalPayouts)
  logger.warn("Reconciliation dead-lettered a stuck tip", { tipId: tip.id, reason })
}

function isPastDeadLetterThreshold(tip: Tip): boolean {
  return Date.now() - tip.updatedAt.getTime() >= env.RECONCILIATION_DEAD_LETTER_THRESHOLD_MS
}

async function reconcileTip(tip: Tip): Promise<ReconcileOutcome> {
  const fanWallet = await walletRepository.findByUserId(tip.fanUserId)
  const destinations = fanWallet ? await resolveExpectedDestinations(tip) : null

  if (!fanWallet || !destinations) {
    if (!isPastDeadLetterThreshold(tip)) {
      return "pending"
    }
    await finalizeAsDeadLettered(
      tip,
      fanWallet ? "One or more payees has no wallet" : "Sender has no wallet"
    )
    return "dead-lettered"
  }

  const since = new Date(tip.updatedAt.getTime() - LOOKBACK_BUFFER_MS).toISOString()
  const sentPayments = await stellarClient.listSentPayments(
    { publicKey: fanWallet.publicKey },
    { sinceISOTime: since, limit: 100 }
  )

  const asset = toAssetDescriptor(tip.asset as TipAssetCode)

  const matchesPerHash = new Map<string, number>()
  for (const destination of destinations) {
    const match = sentPayments.find(
      (payment) =>
        payment.successful &&
        payment.to === destination.publicKey &&
        amountsMatch(payment.amount, destination.amount) &&
        paymentMatchesAsset(payment, asset)
    )
    if (match) {
      matchesPerHash.set(match.hash, (matchesPerHash.get(match.hash) ?? 0) + 1)
    }
  }

  const fullMatch = [...matchesPerHash.entries()].find(
    ([, count]) => count === destinations.length
  )

  if (fullMatch) {
    await finalizeAsConfirmed(tip, fullMatch[0])
    return "confirmed"
  }

  if (!isPastDeadLetterThreshold(tip)) {
    return "pending"
  }

  await finalizeAsDeadLettered(tip, "No matching ledger transaction found during reconciliation")
  return "dead-lettered"
}

export const reconciliationService = {
  /**
   * Compares tips stuck in "submitted" against the fan's actual Horizon
   * payment history, to recover from a worker crash or Horizon disconnect
   * between submitting a transaction and persisting its result locally:
   *
   * - If a matching successful payment is found on-chain for every payee,
   *   the tip (and its payouts) are confirmed with that transaction's hash.
   * - If nothing matches after RECONCILIATION_DEAD_LETTER_THRESHOLD_MS, the
   *   tip is dead-lettered (marked failed with a clear reason) so the fan
   *   can see what happened and retry via POST /api/tips/:id/retry.
   * - Otherwise it's left alone to be checked again on the next run.
   */
  async run(): Promise<ReconciliationSummary> {
    const stuckBefore = new Date(Date.now() - env.RECONCILIATION_STUCK_THRESHOLD_MS)
    const stuckTips = await tipRepository.findStuckSubmitted(stuckBefore)

    const summary: ReconciliationSummary = {
      scanned: stuckTips.length,
      confirmed: 0,
      deadLettered: 0,
      stillPending: 0,
    }

    for (const tip of stuckTips) {
      const outcome = await reconcileTip(tip)
      if (outcome === "confirmed") {
        summary.confirmed += 1
      } else if (outcome === "dead-lettered") {
        summary.deadLettered += 1
      } else {
        summary.stillPending += 1
      }
    }

    metrics.incrementCounter("reconciliation_runs_total")
    metrics.incrementCounter("reconciliation_repaired_total", summary.confirmed)
    metrics.incrementCounter("reconciliation_deadlettered_total", summary.deadLettered)
    metrics.incrementCounter("reconciliation_scanned_total", summary.scanned)

    logger.info("Reconciliation run completed", { ...summary })

    return summary
  },
}
