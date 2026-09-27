export interface HorizonAccountResponse {
  accountId: string;
  sequenceNumber: string;
  nativeBalanceXlm: string;
  isFunded: boolean;
}

export interface HorizonTransactionResult {
  hash: string;
  ledgerSequence: number;
  successful: boolean;
  submittedAt: string;
}

export interface HorizonNetworkConfig {
  horizonUrl: string;
  networkPassphrase: string;
  timeoutMs: number;
}
