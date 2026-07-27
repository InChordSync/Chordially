export function logClientEvent(eventMessage: string, meta?: Record<string, unknown>): void {
  const logData = {
    eventMessage,
    meta: meta ?? {},
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(logData));
}
