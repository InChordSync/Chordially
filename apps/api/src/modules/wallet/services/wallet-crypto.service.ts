import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { DecryptCommand, GenerateDataKeyCommand, KMSClient } from "@aws-sdk/client-kms"
import { env } from "../../../shared/config/env.js"
import { AppError } from "../../../shared/errors/app-error.js"
import type { Wallet } from "../types/wallet.types.js"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH_BYTES = 12

const kms = new KMSClient({ region: env.AWS_REGION })

export interface EncryptedSecret {
  encryptedSecret: string
  encryptedDataKey: string
  iv: string
  authTag: string
}

/**
 * Envelope-encrypts a plaintext secret: a fresh AES-256 data key is minted by
 * KMS, used locally to encrypt the secret, then discarded. Only the
 * KMS-wrapped data key and the encryptedSecret are persisted, so decrypting the
 * secret always requires a call back to KMS.
 */
export async function encryptSecret(plaintext: string): Promise<EncryptedSecret> {
  const dataKeyResult = await kms.send(
    new GenerateDataKeyCommand({ KeyId: env.AWS_KMS_KEY_ID, KeySpec: "AES_256" })
  )

  if (!dataKeyResult.Plaintext || !dataKeyResult.CiphertextBlob) {
    throw new Error("KMS did not return a usable data key")
  }

  const plaintextDataKey = Buffer.from(dataKeyResult.Plaintext)
  const iv = randomBytes(IV_LENGTH_BYTES)
  const cipher = createCipheriv(ALGORITHM, plaintextDataKey, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  plaintextDataKey.fill(0)

  return {
    encryptedSecret: ciphertext.toString("base64"),
    encryptedDataKey: Buffer.from(dataKeyResult.CiphertextBlob).toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  }
}

/**
 * Narrows a Wallet down to its encrypted-secret fields, or throws if this
 * is a linked wallet. This is the one required gate before calling
 * decryptSecret on a Wallet row: since those fields are `string | null` on
 * a linked wallet, TypeScript itself refuses to pass one through without
 * going through this check first (or an unsafe cast), so a linked wallet
 * structurally can't reach KMS decryption.
 */
export function requireCustodialSecrets(wallet: Wallet): EncryptedSecret {
  if (
    wallet.walletType !== "custodial" ||
    wallet.encryptedSecret === null ||
    wallet.encryptedDataKey === null ||
    wallet.iv === null ||
    wallet.authTag === null
  ) {
    throw new AppError(
      400,
      "WALLET_NOT_CUSTODIAL",
      "This operation requires the platform to hold custody of the wallet, and this wallet is linked (self-custodied)"
    )
  }

  return {
    encryptedSecret: wallet.encryptedSecret,
    encryptedDataKey: wallet.encryptedDataKey,
    iv: wallet.iv,
    authTag: wallet.authTag,
  }
}

export async function decryptSecret(encrypted: EncryptedSecret): Promise<string> {
  const decryptResult = await kms.send(
    new DecryptCommand({
      CiphertextBlob: Buffer.from(encrypted.encryptedDataKey, "base64"),
      KeyId: env.AWS_KMS_KEY_ID,
    })
  )

  if (!decryptResult.Plaintext) {
    throw new Error("KMS did not return a usable data key")
  }

  const plaintextDataKey = Buffer.from(decryptResult.Plaintext)
  const decipher = createDecipheriv(ALGORITHM, plaintextDataKey, Buffer.from(encrypted.iv, "base64"))
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"))

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.encryptedSecret, "base64")),
    decipher.final(),
  ])

  plaintextDataKey.fill(0)

  return plaintext.toString("utf8")
}
