import { NATIVE_ASSET, type StellarAssetDescriptor } from "@chordially/stellar"
import { env } from "../config/env.js"

/** The set of assets a tip may be denominated in. */
export type TipAssetCode = "native" | "USDC"

export function toAssetDescriptor(assetCode: TipAssetCode): StellarAssetDescriptor {
  if (assetCode === "native") {
    return NATIVE_ASSET
  }

  return { code: "USDC", issuer: env.STELLAR_USDC_ISSUER }
}
