export interface PrepareTipInput {
  amount: string;
  asset: "XLM" | "USDC";
  destination: string;
}

export interface PreparedTipIntent {
  id: string;
  network: "testnet";
  asset: "XLM" | "USDC";
  amount: string;
  destination: string;
  memo: string;
  submitMode: "manual";
}

export interface StellarService {
  prepareTipIntent(input: PrepareTipInput): PreparedTipIntent;
}
