import type { WalletAuthTelemetryPayload } from "@chordially/types";

type StellarWalletAuthTelemetryInput =
  Omit<WalletAuthTelemetryPayload, "occurredAt" | "service"> &
  Partial<Pick<WalletAuthTelemetryPayload, "occurredAt">>;

type WalletAuthTelemetrySink = (event: WalletAuthTelemetryPayload) => void;

const defaultSink: WalletAuthTelemetrySink = (event) => {
  console.info("[wallet-auth-telemetry]", JSON.stringify(event));
};

let sink: WalletAuthTelemetrySink = defaultSink;

export function setWalletAuthTelemetrySink(next?: WalletAuthTelemetrySink): void {
  sink = next ?? defaultSink;
}

export function emitWalletAuthTelemetry(event: StellarWalletAuthTelemetryInput): void {
  sink({
    service: "stellar-service",
    occurredAt: new Date().toISOString(),
    ...event,
  });
}
