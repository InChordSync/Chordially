export function logClientEvent(
  eventMessage: string, 
  meta?: Record<string, unknown>,
  level: "info" | "warn" | "error" = "info",
  correlationId?: string
): void {
  const logData = {
    level,
    eventMessage,
    correlationId: correlationId ?? `corr-${Math.random().toString(36).substring(2, 11)}`,
    meta: meta ?? {},
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(logData));
}
