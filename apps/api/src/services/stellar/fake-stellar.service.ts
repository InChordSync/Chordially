import crypto from "node:crypto";
import type {
  PrepareTipInput,
  PreparedTipIntent,
  StellarService
} from "./stellar.types.js";

export class FakeStellarService implements StellarService {
  prepareTipIntent(input: PrepareTipInput): PreparedTipIntent {
    return {
      id: crypto.randomUUID(),
      network: "testnet",
      asset: input.asset,
      amount: input.amount,
      destination: input.destination,
      memo: `tip:${input.destination.slice(0, 6)}`,
      submitMode: "manual"
    };
  }
}
