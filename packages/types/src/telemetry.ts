export const WALLET_AUTH_TELEMETRY_EVENTS = {
  walletLinkStarted: "wallet_link.started",
  walletLinkSucceeded: "wallet_link.succeeded",
  walletAuthFailed: "wallet_auth.failed",
  walletLinkRevoked: "wallet_link.revoked",
} as const;

export type WalletAuthTelemetryEventName =
  (typeof WALLET_AUTH_TELEMETRY_EVENTS)[keyof typeof WALLET_AUTH_TELEMETRY_EVENTS];

export type WalletAuthTelemetryOutcome =
  | "start"
  | "success"
  | "failure"
  | "revocation";

export type WalletAuthTelemetryBoundary =
  | "api.auth.login"
  | "api.auth.logout"
  | "api.auth.logout_all"
  | "stellar.starter_intent";

export type WalletAuthTelemetryService = "api" | "stellar-service";

export type WalletAuthTelemetryPayload = {
  event: WalletAuthTelemetryEventName;
  outcome: WalletAuthTelemetryOutcome;
  service: WalletAuthTelemetryService;
  boundary: WalletAuthTelemetryBoundary;
  occurredAt: string;
  /**
   * Internal stable identifier only. Do not populate this with email,
   * wallet addresses, access tokens, refresh tokens, signatures, IPs, or
   * user-agent strings.
   */
  subjectId?: string;
  network?: "testnet" | "mainnet";
  reason?: string;
  sessionsRevoked?: number;
};
