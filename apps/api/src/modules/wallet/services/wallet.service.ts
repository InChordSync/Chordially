import { env } from "../../../shared/config/env.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import { metrics } from "../../../shared/metrics/metrics.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { toAssetDescriptor } from "../../../shared/stellar/assets.js"
import { walletRepository } from "../repositories/wallet.repository.js"
import type {
  TrustlineResponse,
  Wallet,
  WalletMeResponse,
  WalletType,
} from "../types/wallet.types.js"
import { verifyWalletLinkChallenge } from "../../../shared/wallet-link/challenge.js"
import { decryptSecret, encryptSecret, requireCustodialSecrets } from "./wallet-crypto.service.js"

/**
 * Provisions the new account on the ledger so it exists and can transact
 * immediately. The real (production-capable) path sponsors the account's
 * base reserve from the platform's sponsor account, so the user never needs
 * to hold XLM before their first transaction. Without a configured sponsor
 * key, this falls back to the testnet Friendbot faucet, which only works on
 * testnet — that fallback exists for local development and tests only.
 */
async function provisionAccountOnLedger(keypair: { publicKey: string; secretKey: string }, userId: string): Promise<void> {
  if (env.STELLAR_SPONSOR_SECRET_KEY) {
    try {
      await stellarClient.sponsorAccountCreation({
        sponsorSecretKey: env.STELLAR_SPONSOR_SECRET_KEY,
        newAccountPublicKey: keypair.publicKey,
        newAccountSecretKey: keypair.secretKey,
      })
    } catch (error) {
      if (stellarClient.isInsufficientSponsorBalanceError(error)) {
        logger.error("Sponsor account cannot cover a new wallet's reserve", {
          userId,
          publicKey: keypair.publicKey,
        })
        throw new AppError(
          503,
          "SPONSOR_ACCOUNT_DEPLETED",
          "Unable to provision a wallet right now. Please try again shortly."
        )
      }

      logger.error("Sponsored account creation failed for new wallet", {
        userId,
        publicKey: keypair.publicKey,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new AppError(
        502,
        "WALLET_PROVISIONING_FAILED",
        "Unable to provision a wallet right now. Please try again shortly."
      )
    }

    await warnIfSponsorBalanceLow()
    return
  }

  if (env.STELLAR_NETWORK === "testnet") {
    try {
      await stellarClient.fundTestnetAccount({ publicKey: keypair.publicKey })
    } catch (error) {
      logger.warn("Friendbot funding failed for new wallet", {
        userId,
        publicKey: keypair.publicKey,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

async function warnIfSponsorBalanceLow(): Promise<void> {
  if (!env.STELLAR_SPONSOR_PUBLIC_KEY) {
    return
  }

  try {
    const balance = await stellarClient.getSponsorBalance(env.STELLAR_SPONSOR_PUBLIC_KEY)
    metrics.setGauge("stellar_sponsor_balance_xlm", Number(balance))

    if (Number(balance) < env.STELLAR_SPONSOR_LOW_BALANCE_XLM) {
      logger.warn("Sponsor account balance is running low", {
        balance,
        thresholdXlm: env.STELLAR_SPONSOR_LOW_BALANCE_XLM,
      })
    }
  } catch (error) {
    // Balance monitoring is best-effort observability, not part of the
    // signup path itself — a failure here must never fail wallet creation.
    logger.warn("Unable to check sponsor account balance", {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const walletService = {
  async createWalletForUser(userId: string): Promise<Wallet> {
    const keypair = stellarClient.generateKeypair()
    const encrypted = await encryptSecret(keypair.secretKey)

    await provisionAccountOnLedger(keypair, userId)

    const wallet = await walletRepository.create({
      userId,
      publicKey: keypair.publicKey,
      network: env.STELLAR_NETWORK,
      ...encrypted,
    })

    return wallet
  },

  /**
   * Registers a linked (non-custodial) wallet: the platform stores only the
   * public key it was given — the caller must have already proven control
   * of it via a signed link challenge (see shared/wallet-link/challenge.js)
   * before this is called. No sponsorship or funding happens here: a linked
   * wallet is assumed to already exist and be funded, since we hold no
   * secret to co-sign a sponsored account-creation transaction with.
   */
  /**
   * Validates a wallet-link proof and target public key without writing
   * anything — lets a caller (e.g. registration) fail fast before creating
   * any other rows, rather than discovering an invalid proof only after a
   * user account already exists.
   */
  async assertLinkableWallet(publicKey: string, challenge: string, signature: string): Promise<void> {
    if (!verifyWalletLinkChallenge(challenge, publicKey, signature)) {
      throw new AppError(
        400,
        "INVALID_LINK_PROOF",
        "Could not verify control of this Stellar account. The challenge may be expired or the signature invalid."
      )
    }

    const existing = await walletRepository.findByPublicKey(publicKey)
    if (existing) {
      throw new AppError(
        409,
        "WALLET_ALREADY_LINKED",
        "This Stellar account is already linked to another user"
      )
    }
  },

  async linkWallet(
    userId: string,
    publicKey: string,
    challenge: string,
    signature: string
  ): Promise<Wallet> {
    await this.assertLinkableWallet(publicKey, challenge, signature)

    return walletRepository.createLinked({ userId, publicKey, network: env.STELLAR_NETWORK })
  },

  async getWalletForUser(userId: string): Promise<WalletMeResponse> {
    const wallet = await walletRepository.findByUserId(userId)

    if (!wallet) {
      throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user")
    }

    let balance = "0"
    let usdcBalance = "0"

    try {
      balance = await stellarClient.getNativeBalance({ publicKey: wallet.publicKey })
      if (wallet.usdcTrustline) {
        usdcBalance = await stellarClient.getAssetBalance(
          { publicKey: wallet.publicKey },
          toAssetDescriptor("USDC")
        )
      }
    } catch (error) {
      // The account may not exist on the ledger yet (e.g. Friendbot funding
      // failed or hasn't landed). Report a zero balance rather than erroring.
      if (!stellarClient.isAccountNotFoundError(error)) {
        throw error
      }
    }

    return {
      publicKey: wallet.publicKey,
      balance,
      network: wallet.network,
      walletType: wallet.walletType as WalletType,
      usdcTrustline: wallet.usdcTrustline,
      usdcBalance,
    }
  },

  /**
   * Establishes a USDC trustline for the caller's wallet, sponsored by the
   * platform (same sponsor used for account creation — see
   * provisionAccountOnLedger) so the fan/creator never needs to hold XLM to
   * cover the trustline's reserve. Required before a USDC-denominated tip
   * can be sent to or received by this wallet.
   */
  async establishUsdcTrustline(userId: string): Promise<TrustlineResponse> {
    const wallet = await walletRepository.findByUserId(userId)

    if (!wallet) {
      throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user")
    }

    if (wallet.usdcTrustline) {
      return { usdcTrustline: true }
    }

    const secretKey = await decryptSecret(requireCustodialSecrets(wallet))

    try {
      await stellarClient.establishTrustline({
        accountSecretKey: secretKey,
        asset: toAssetDescriptor("USDC"),
        sponsorSecretKey: env.STELLAR_SPONSOR_SECRET_KEY || undefined,
      })
    } catch (error) {
      if (stellarClient.isInsufficientSponsorBalanceError(error)) {
        throw new AppError(
          503,
          "SPONSOR_ACCOUNT_DEPLETED",
          "Unable to set up USDC right now. Please try again shortly."
        )
      }

      logger.error("Establishing USDC trustline failed", {
        userId,
        publicKey: wallet.publicKey,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new AppError(
        502,
        "TRUSTLINE_ESTABLISHMENT_FAILED",
        "Unable to set up USDC right now. Please try again shortly."
      )
    }

    await walletRepository.markUsdcTrustlineEstablished(userId)

    return { usdcTrustline: true }
  },
}
