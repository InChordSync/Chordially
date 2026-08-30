import { Prisma } from "@prisma/client"
import { creatorService } from "../../creators/services/creator.service.js"
import { userService } from "../../users/services/user.service.js"
import { walletRepository } from "../../wallet/repositories/wallet.repository.js"
import { decryptSecret, requireCustodialSecrets } from "../../wallet/services/wallet-crypto.service.js"
import type { Wallet } from "../../wallet/types/wallet.types.js"
import { anchorClient } from "../../../shared/anchor/client.js"
import { authenticateWithAnchor } from "../../../shared/anchor/sep24-client.js"
import { env } from "../../../shared/config/env.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { toAssetDescriptor, type TipAssetCode } from "../../../shared/stellar/assets.js"
import { creatorPayoutRepository } from "../repositories/creator-payout.repository.js"
import {
  toCreatorPayoutResponse,
  type CreatorPayoutResponse,
} from "../types/creator-payout.types.js"

const MAX_SUBMISSION_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 200
const TERMINAL_STATUSES = new Set(["completed", "failed"])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function findOwnCreatorProfile(userId: string) {
  const creator = await creatorService.findByUserId(userId)
  if (!creator) {
    throw new AppError(404, "CREATOR_PROFILE_NOT_FOUND", "No creator profile for this account")
  }
  return creator
}

export const creatorPayoutService = {
  /**
   * Requests a cash-out of accumulated tips: authenticates the creator's
   * custodial wallet with the anchor and starts a SEP-24 interactive
   * withdrawal session. The on-chain leg isn't submitted yet — the anchor
   * needs to hand back its receiving account first, which only happens
   * once the creator completes the interactive flow (see
   * `refreshPayoutStatus`, which drives the rest of the state machine).
   */
  async initiatePayout(
    userId: string,
    amount: string,
    assetCode: TipAssetCode,
    idempotencyKey: string
  ): Promise<CreatorPayoutResponse> {
    const [creator, account] = await Promise.all([
      findOwnCreatorProfile(userId),
      userService.findById(userId),
    ])

    if (account && !account.emailVerified) {
      throw new AppError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Verify your email address before withdrawing funds"
      )
    }

    const existing = await creatorPayoutRepository.findByIdempotencyKey(creator.id, idempotencyKey)
    if (existing) {
      return toCreatorPayoutResponse(existing)
    }

    if (Number(amount) < env.CREATOR_PAYOUT_MINIMUM_AMOUNT) {
      throw new AppError(
        400,
        "PAYOUT_BELOW_MINIMUM",
        `Payouts must be at least ${env.CREATOR_PAYOUT_MINIMUM_AMOUNT} ${assetCode}`
      )
    }

    const wallet = await walletRepository.findByUserId(userId)
    if (!wallet) {
      throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user")
    }

    const balance = await stellarClient.getAssetBalance(
      { publicKey: wallet.publicKey },
      toAssetDescriptor(assetCode)
    )
    if (Number(balance) < Number(amount)) {
      throw new AppError(400, "INSUFFICIENT_BALANCE", "Wallet balance is lower than the requested payout")
    }

    const secretKey = await decryptSecret(requireCustodialSecrets(wallet))

    let token: string
    try {
      token = await authenticateWithAnchor(anchorClient, wallet.publicKey, secretKey)
    } catch (error) {
      logger.error("Anchor SEP-10 authentication failed for payout", {
        userId,
        error: errorMessage(error),
      })
      throw new AppError(502, "ANCHOR_AUTH_FAILED", "Unable to start a payout right now. Please try again shortly.")
    }

    let interactive: { id: string; url: string }
    try {
      interactive = await anchorClient.startInteractiveWithdrawal({
        token,
        assetCode,
        account: wallet.publicKey,
      })
    } catch (error) {
      logger.error("Anchor interactive withdrawal request failed", {
        userId,
        error: errorMessage(error),
      })
      throw new AppError(
        502,
        "ANCHOR_WITHDRAWAL_START_FAILED",
        "Unable to start a payout right now. Please try again shortly."
      )
    }

    let payout
    try {
      payout = await creatorPayoutRepository.create({
        creatorId: creator.id,
        assetCode,
        amount,
        idempotencyKey,
        anchorTransactionId: interactive.id,
        interactiveUrl: interactive.url,
      })
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        const winner = await creatorPayoutRepository.findByIdempotencyKey(creator.id, idempotencyKey)
        if (winner) {
          return toCreatorPayoutResponse(winner)
        }
      }
      throw error
    }

    return toCreatorPayoutResponse(payout)
  },

  async listPayoutsForCreator(userId: string): Promise<CreatorPayoutResponse[]> {
    const creator = await findOwnCreatorProfile(userId)
    const payouts = await creatorPayoutRepository.findByCreatorId(creator.id)
    return payouts.map(toCreatorPayoutResponse)
  },

  /**
   * Drives the payout's state machine forward one step: while awaiting the
   * anchor's receiving account, checks whether it's ready and submits the
   * on-chain leg the moment it is (idempotently — a payout that already has
   * a txHash never submits again); once submitted, checks whether the
   * anchor has confirmed receipt and completed the fiat leg on its side.
   */
  async refreshPayoutStatus(userId: string, payoutId: string): Promise<CreatorPayoutResponse> {
    const creator = await findOwnCreatorProfile(userId)
    const payout = await creatorPayoutRepository.findById(payoutId)

    if (!payout || payout.creatorId !== creator.id) {
      throw new AppError(404, "PAYOUT_NOT_FOUND", "Payout not found")
    }

    if (TERMINAL_STATUSES.has(payout.status)) {
      return toCreatorPayoutResponse(payout)
    }

    const wallet = await walletRepository.findByUserId(userId)
    if (!wallet) {
      throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user")
    }

    let token: string
    let anchorStatus
    try {
      const secretKey = await decryptSecret(requireCustodialSecrets(wallet))
      token = await authenticateWithAnchor(anchorClient, wallet.publicKey, secretKey)
      anchorStatus = await anchorClient.fetchTransaction({
        token,
        id: payout.anchorTransactionId,
      })
    } catch (error) {
      logger.warn("Unable to refresh payout status from anchor", {
        userId,
        payoutId,
        error: errorMessage(error),
      })
      return toCreatorPayoutResponse(payout)
    }

    if (anchorStatus.status === "error" || anchorStatus.status === "expired") {
      const failed = await creatorPayoutRepository.markFailed(
        payout.id,
        anchorStatus.message ?? `Anchor reported ${anchorStatus.status}`,
        payout.attempts
      )
      return toCreatorPayoutResponse(failed)
    }

    // Not submitted yet: attempt the on-chain leg once the anchor has told
    // us where to send it.
    if (payout.status === "awaiting_anchor_details" && anchorStatus.withdrawAnchorAccount) {
      const submitted = await submitOnChainLeg(payout.id, wallet, anchorStatus.withdrawAnchorAccount, payout.amount, payout.assetCode as TipAssetCode, payout.attempts)
      if (submitted) {
        return toCreatorPayoutResponse(submitted)
      }
    }

    if (payout.status === "submitted" && anchorStatus.status === "completed") {
      const completed = await creatorPayoutRepository.markCompleted(payout.id)
      return toCreatorPayoutResponse(completed)
    }

    return toCreatorPayoutResponse(payout)
  },
}

async function submitOnChainLeg(
  payoutId: string,
  wallet: Wallet,
  destinationPublicKey: string,
  amount: string,
  assetCode: TipAssetCode,
  startingAttempts: number
) {
  const sourceSecretKey = await decryptSecret(requireCustodialSecrets(wallet))
  const asset = toAssetDescriptor(assetCode)

  let attempts = startingAttempts
  let lastError: unknown

  while (attempts < MAX_SUBMISSION_ATTEMPTS) {
    attempts += 1

    try {
      const result = await stellarClient.submitPayment({
        sourceSecretKey,
        destinationPublicKey,
        amount,
        asset,
      })
      return await creatorPayoutRepository.markSubmitted(payoutId, result.hash, attempts)
    } catch (error) {
      lastError = error
      const transient = stellarClient.isTransientSubmissionError(error)
      logger.warn("Payout on-chain submission attempt failed", {
        payoutId,
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

  return creatorPayoutRepository.markFailed(payoutId, errorMessage(lastError), attempts)
}
