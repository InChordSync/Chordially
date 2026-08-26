import { anchorClient } from "../../../shared/anchor/client.js"
import { authenticateWithAnchor } from "../../../shared/anchor/sep24-client.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import type { TipAssetCode } from "../../../shared/stellar/assets.js"
import { depositRepository } from "../repositories/deposit.repository.js"
import { walletRepository } from "../repositories/wallet.repository.js"
import type { WalletDepositResponse } from "../types/deposit.types.js"
import { toWalletDepositResponse } from "../types/deposit.types.js"
import { decryptSecret } from "./wallet-crypto.service.js"

const TERMINAL_STATUSES = new Set(["completed", "error", "expired"])

export const depositService = {
  /**
   * Kicks off a SEP-24 interactive deposit: authenticates the fan's
   * custodial wallet with the anchor (SEP-10), then starts the interactive
   * session and hands back the URL the client opens to complete it. This is
   * the platform's first real fiat-in path — the only funding source before
   * this was the testnet Friendbot faucet, which has no production
   * equivalent.
   */
  async initiateDeposit(userId: string, assetCode: TipAssetCode): Promise<WalletDepositResponse> {
    const wallet = await walletRepository.findByUserId(userId)
    if (!wallet) {
      throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user")
    }

    let token: string
    try {
      const secretKey = await decryptSecret(wallet)
      token = await authenticateWithAnchor(anchorClient, wallet.publicKey, secretKey)
    } catch (error) {
      logger.error("Anchor SEP-10 authentication failed", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new AppError(
        502,
        "ANCHOR_AUTH_FAILED",
        "Unable to start a deposit right now. Please try again shortly."
      )
    }

    let interactive: { id: string; url: string }
    try {
      interactive = await anchorClient.startInteractiveDeposit({
        token,
        assetCode,
        account: wallet.publicKey,
      })
    } catch (error) {
      logger.error("Anchor interactive deposit request failed", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new AppError(
        502,
        "ANCHOR_DEPOSIT_START_FAILED",
        "Unable to start a deposit right now. Please try again shortly."
      )
    }

    const deposit = await depositRepository.create({
      userId,
      assetCode,
      anchorTransactionId: interactive.id,
      interactiveUrl: interactive.url,
    })

    return toWalletDepositResponse(deposit)
  },

  async listDepositsForUser(userId: string): Promise<WalletDepositResponse[]> {
    const deposits = await depositRepository.findByUserId(userId)
    return deposits.map(toWalletDepositResponse)
  },

  /**
   * Refreshes a deposit's status from the anchor. A completed deposit needs
   * no local credit step — per SEP-24 the anchor sends funds straight to
   * the fan's Stellar account — this just keeps our own record in sync so
   * the fan can see it happened.
   */
  async refreshDepositStatus(userId: string, depositId: string): Promise<WalletDepositResponse> {
    const deposit = await depositRepository.findById(depositId)
    if (!deposit || deposit.userId !== userId) {
      throw new AppError(404, "DEPOSIT_NOT_FOUND", "Deposit not found")
    }

    if (TERMINAL_STATUSES.has(deposit.status)) {
      return toWalletDepositResponse(deposit)
    }

    const wallet = await walletRepository.findByUserId(userId)
    if (!wallet) {
      throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user")
    }

    try {
      const secretKey = await decryptSecret(wallet)
      const token = await authenticateWithAnchor(anchorClient, wallet.publicKey, secretKey)
      const status = await anchorClient.fetchTransaction({ token, id: deposit.anchorTransactionId })

      const updated = await depositRepository.updateStatus(deposit.id, {
        status: status.status,
        amountIn: status.amountIn ?? deposit.amountIn,
        failureReason: status.status === "error" ? (status.message ?? "Anchor reported an error") : null,
      })

      return toWalletDepositResponse(updated)
    } catch (error) {
      logger.warn("Unable to refresh deposit status from anchor", {
        userId,
        depositId,
        error: error instanceof Error ? error.message : String(error),
      })
      // Status refresh is best-effort — return the last known local state
      // rather than failing the request outright.
      return toWalletDepositResponse(deposit)
    }
  },
}
