import crypto from "node:crypto"
import { Prisma } from "@prisma/client"
import { creatorService } from "../../creators/services/creator.service.js"
import { splitAmount } from "../../streams/services/payout-split.util.js"
import { streamPayoutConfigService } from "../../streams/services/stream-payout-config.service.js"
import { streamService } from "../../streams/services/stream.service.js"
import { walletRepository } from "../../wallet/repositories/wallet.repository.js"
import { decryptSecret, requireCustodialSecrets } from "../../wallet/services/wallet-crypto.service.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import { metrics } from "../../../shared/metrics/metrics.js"
import { tipEventBus } from "../../../shared/realtime/tip-event-bus.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { toAssetDescriptor, type TipAssetCode } from "../../../shared/stellar/assets.js"
import { tipPayoutRepository } from "../repositories/tip-payout.repository.js"
import { tipRepository } from "../repositories/tip.repository.js"
import { toTipPayoutResponse, type TipPayout } from "../types/tip-payout.types.js"
import {
  toTipResponse,
  type CreateTipInput,
  type Tip,
  type TipResponse,
  type TipStatus,
} from "../types/tip.types.js"

const MAX_SUBMISSION_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 200

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function publishTipEvent(tip: Tip, payouts: TipPayout[]): void {
  if (!tip.streamId) {
    return
  }

  tipEventBus.publish({
    streamId: tip.streamId,
    tipId: tip.id,
    creatorId: tip.creatorId,
    fanUserId: tip.fanUserId,
    amount: tip.amount,
    status: tip.status as TipStatus,
    txHash: tip.txHash,
    failureReason: tip.failureReason,
    ...(payouts.length > 0 ? { payouts: payouts.map(toTipPayoutResponse) } : {}),
  })
}

/**
 * Every state transition below moves the Tip row and (for a split tip) all
 * of its TipPayout rows together, then publishes one feed event carrying
 * both. This helper keeps those three steps in lockstep so a split tip's
 * payouts can never drift out of sync with its parent tip's status.
 */
async function transition(
  tip: Tip,
  isSplit: boolean,
  applyToTip: () => Promise<Tip>,
  applyToPayouts: () => Promise<unknown>
): Promise<{ tip: Tip; payouts: TipPayout[] }> {
  const [updatedTip] = await Promise.all([
    applyToTip(),
    isSplit ? applyToPayouts() : Promise.resolve(),
  ])
  const payouts = isSplit ? await tipPayoutRepository.findByTipId(tip.id) : []
  publishTipEvent(updatedTip, payouts)
  return { tip: updatedTip, payouts }
}

interface PayoutDestination {
  destinationPublicKey: string
  amount: string
}

function walletSupportsAsset(wallet: { usdcTrustline: boolean }, assetCode: TipAssetCode): boolean {
  return assetCode === "native" || wallet.usdcTrustline
}

type ResolveDestinationsResult =
  | { ok: true; destinations: PayoutDestination[] }
  | { ok: false; reason: string }

/** Resolves each payee's wallet, or a failure reason if any payee has none or hasn't set up the tip's asset. */
async function resolvePayoutDestinations(
  payouts: TipPayout[],
  assetCode: TipAssetCode
): Promise<ResolveDestinationsResult> {
  const destinations: PayoutDestination[] = []

  for (const payout of payouts) {
    const creator = await creatorService.findById(payout.creatorId)
    const wallet = creator ? await walletRepository.findByUserId(creator.userId) : null
    if (!wallet) {
      return { ok: false, reason: "One or more payees has no wallet" }
    }
    if (!walletSupportsAsset(wallet, assetCode)) {
      return { ok: false, reason: `One or more payees has not set up ${assetCode} yet` }
    }
    destinations.push({ destinationPublicKey: wallet.publicKey, amount: payout.amount })
  }

  return { ok: true, destinations }
}

function recordFinalMetrics(
  tip: Tip,
  finalStatus: TipStatus,
  submissionStartedAt: number,
  isSplit: boolean
): void {
  const now = Date.now()
  const retries = Math.max(0, tip.attempts - 1)

  metrics.incrementCounter("tip_retry_total", retries)
  metrics.observeLatency("tip_submission_latency_ms", now - submissionStartedAt)

  if (finalStatus === "confirmed") {
    metrics.incrementCounter("tip_confirmed_total")
    metrics.observeLatency("tip_confirmation_latency_ms", now - tip.createdAt.getTime())
  } else if (finalStatus === "failed") {
    metrics.incrementCounter("tip_failed_total")
  }

  logger.info("Tip finalized", {
    tipId: tip.id,
    status: finalStatus,
    attempts: tip.attempts,
    retries,
    isSplit,
  })
}

async function submitToStellar(tip: Tip, initialPayouts: TipPayout[]): Promise<Tip> {
  const isSplit = initialPayouts.length > 0
  const submissionStartedAt = Date.now()
  const assetCode = tip.asset as TipAssetCode
  const fanWallet = await walletRepository.findByUserId(tip.fanUserId)

  async function fail(reason: string): Promise<Tip> {
    const { tip: failed } = await transition(
      tip,
      isSplit,
      () => tipRepository.markFailed(tip.id, reason, tip.attempts),
      () => tipPayoutRepository.markFailedForTip(tip.id, reason)
    )
    recordFinalMetrics(failed, "failed", submissionStartedAt, isSplit)
    return failed
  }

  if (!fanWallet) {
    return fail("Sender has no wallet")
  }

  if (!walletSupportsAsset(fanWallet, assetCode)) {
    return fail(`Sender has not set up ${assetCode} yet`)
  }

  const singleCreator = isSplit ? null : await creatorService.findById(tip.creatorId)
  const singleWallet =
    !isSplit && singleCreator ? await walletRepository.findByUserId(singleCreator.userId) : null
  const resolvedDestinations = isSplit
    ? await resolvePayoutDestinations(initialPayouts, assetCode)
    : null

  if (isSplit && resolvedDestinations && !resolvedDestinations.ok) {
    return fail(resolvedDestinations.reason)
  }

  if (!isSplit && !singleWallet) {
    return fail("Creator has no wallet")
  }

  if (!isSplit && singleWallet && !walletSupportsAsset(singleWallet, assetCode)) {
    return fail(`Creator has not set up ${assetCode} yet`)
  }

  const destinations =
    resolvedDestinations && resolvedDestinations.ok ? resolvedDestinations.destinations : null
  const asset = toAssetDescriptor(assetCode)

  if (fanWallet.walletType === "linked") {
    // A linked wallet has no secret we can decrypt and sign with — the fan
    // must sign externally. Split tips aren't supported here yet (tracked
    // as a follow-up): resolving which of several split-payment failure
    // states to surface to an external signer adds real complexity that's
    // out of scope for this pass.
    if (isSplit) {
      return fail("Split tips are not yet supported for linked wallets")
    }

    let unsignedTransactionXdr: string
    try {
      unsignedTransactionXdr = await stellarClient.buildPaymentTransactionXdr({
        sourcePublicKey: fanWallet.publicKey,
        destinationPublicKey: singleWallet!.publicKey,
        amount: tip.amount,
        asset,
      })
    } catch (error) {
      return fail(errorMessage(error))
    }

    const awaitingSignature = await tipRepository.markAwaitingSignature(
      tip.id,
      unsignedTransactionXdr
    )
    publishTipEvent(awaitingSignature, [])
    return awaitingSignature
  }

  await transition(
    tip,
    isSplit,
    () => tipRepository.updateStatus(tip.id, "submitted"),
    () => tipPayoutRepository.updateStatusForTip(tip.id, "submitted")
  )

  const sourceSecretKey = await decryptSecret(requireCustodialSecrets(fanWallet))

  let attempts = tip.attempts
  let lastError: unknown

  while (attempts < MAX_SUBMISSION_ATTEMPTS) {
    attempts += 1

    try {
      const result = destinations
        ? await stellarClient.submitSplitPayment({ sourceSecretKey, payments: destinations, asset })
        : await stellarClient.submitPayment({
            sourceSecretKey,
            destinationPublicKey: singleWallet!.publicKey,
            amount: tip.amount,
            asset,
          })

      const { tip: confirmed } = await transition(
        tip,
        isSplit,
        () => tipRepository.markConfirmed(tip.id, result.hash, attempts),
        () => tipPayoutRepository.markConfirmedForTip(tip.id, result.hash)
      )
      recordFinalMetrics(confirmed, "confirmed", submissionStartedAt, isSplit)
      return confirmed
    } catch (error) {
      lastError = error

      const transient = stellarClient.isTransientSubmissionError(error)
      logger.warn("Tip submission attempt failed", {
        tipId: tip.id,
        attempt: attempts,
        transient,
        error: errorMessage(error),
      })

      if (!transient || attempts >= MAX_SUBMISSION_ATTEMPTS) {
        break
      }

      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempts - 1))
    }
  }

  const reason = errorMessage(lastError)
  const { tip: failed } = await transition(
    tip,
    isSplit,
    () => tipRepository.markFailed(tip.id, reason, attempts),
    () => tipPayoutRepository.markFailedForTip(tip.id, reason)
  )
  recordFinalMetrics(failed, "failed", submissionStartedAt, isSplit)
  return failed
}

export const tipService = {
  async submitTip(input: CreateTipInput): Promise<TipResponse> {
    const existing = await tipRepository.findByIdempotencyKey(
      input.fanUserId,
      input.idempotencyKey
    )

    if (existing) {
      const payouts = await tipPayoutRepository.findByTipId(existing.id)
      return toTipResponse(existing, payouts)
    }

    const creator = await creatorService.findById(input.creatorId)
    if (!creator) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    let payoutConfig = null
    if (input.streamId) {
      const stream = await streamService.findById(input.streamId)
      if (!stream) {
        throw new AppError(404, "STREAM_NOT_FOUND", "Stream not found")
      }
      if (stream.creatorId !== creator.id) {
        throw new AppError(
          400,
          "STREAM_CREATOR_MISMATCH",
          "This stream does not belong to the given creator"
        )
      }
      payoutConfig = await streamPayoutConfigService.findByStreamId(input.streamId)
    }

    let tip: Tip

    try {
      tip = await tipRepository.create(input)
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        // Lost a race with a concurrent request using the same idempotency
        // key; return its result instead of submitting a second payment.
        const winner = await tipRepository.findByIdempotencyKey(
          input.fanUserId,
          input.idempotencyKey
        )
        if (winner) {
          const payouts = await tipPayoutRepository.findByTipId(winner.id)
          return toTipResponse(winner, payouts)
        }
      }
      throw error
    }

    let payouts: TipPayout[] = []
    if (payoutConfig) {
      const shares = splitAmount(
        tip.amount,
        payoutConfig.payees.map((payee) => ({
          creatorId: payee.creatorId,
          percentage: payee.percentage,
        }))
      )
      payouts = await tipPayoutRepository.createMany(
        shares.map((share) => ({
          tipId: tip.id,
          creatorId: share.creatorId,
          percentage: share.percentage,
          amount: share.amount,
        }))
      )
    }

    publishTipEvent(tip, payouts)

    const finalTip = await submitToStellar(tip, payouts)
    const finalPayouts = await tipPayoutRepository.findByTipId(tip.id)
    return toTipResponse(finalTip, finalPayouts)
  },

  /**
   * Completes a linked-wallet tip: the fan signed the unsigned transaction
   * `submitTip` returned earlier (see submitToStellar's "linked" branch)
   * with their own external wallet, and submits it back here. This never
   * touches wallet-crypto.service.ts — there is no secret to decrypt.
   */
  async submitSignedTip(
    tipId: string,
    fanUserId: string,
    signedTransactionXdr: string
  ): Promise<TipResponse> {
    const tip = await tipRepository.findById(tipId)
    if (!tip || tip.fanUserId !== fanUserId) {
      throw new AppError(404, "TIP_NOT_FOUND", "Tip not found")
    }

    if (tip.status !== "awaiting_signature") {
      throw new AppError(
        400,
        "TIP_NOT_AWAITING_SIGNATURE",
        "This tip is not waiting on an external signature"
      )
    }

    try {
      const result = await stellarClient.submitSignedTransactionXdr(signedTransactionXdr)
      const confirmed = await tipRepository.markConfirmed(tip.id, result.hash, tip.attempts + 1)
      publishTipEvent(confirmed, [])
      logger.info("Tip finalized", { tipId: tip.id, status: "confirmed", isSplit: false })
      return toTipResponse(confirmed)
    } catch (error) {
      const reason = errorMessage(error)
      const failed = await tipRepository.markFailed(tip.id, reason, tip.attempts + 1)
      publishTipEvent(failed, [])
      logger.warn("Signed tip submission failed", { tipId: tip.id, error: reason })
      return toTipResponse(failed)
    }
  },

  async getTipForFan(tipId: string, fanUserId: string): Promise<TipResponse> {
    const tip = await tipRepository.findById(tipId)
    if (!tip || tip.fanUserId !== fanUserId) {
      throw new AppError(404, "TIP_NOT_FOUND", "Tip not found")
    }

    const payouts = await tipPayoutRepository.findByTipId(tip.id)
    return toTipResponse(tip, payouts)
  },

  /**
   * The dead-letter recovery path: a permanently failed tip can be retried
   * safely because this creates a brand-new Tip with a fresh idempotency
   * key (so it's a completely independent payment attempt, never a
   * resubmission of the original), while `retriedFromTipId` keeps the
   * failure history visible.
   */
  async retryTip(tipId: string, fanUserId: string): Promise<TipResponse> {
    const original = await tipRepository.findById(tipId)
    if (!original || original.fanUserId !== fanUserId) {
      throw new AppError(404, "TIP_NOT_FOUND", "Tip not found")
    }

    if (original.status !== "failed") {
      throw new AppError(
        400,
        "TIP_NOT_RETRYABLE",
        "Only a failed tip can be retried"
      )
    }

    return this.submitTip({
      fanUserId,
      creatorId: original.creatorId,
      amount: original.amount,
      streamId: original.streamId ?? undefined,
      idempotencyKey: crypto.randomUUID(),
      retriedFromTipId: original.id,
      asset: original.asset as TipAssetCode,
    })
  },
}
