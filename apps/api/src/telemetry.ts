import type { WalletAuthTelemetryPayload } from "@chordially/types";

type ApiWalletAuthTelemetryInput =
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

export function emitWalletAuthTelemetry(event: ApiWalletAuthTelemetryInput): void {
  sink({
    service: "api",
    occurredAt: new Date().toISOString(),
    ...event,
  });
}
