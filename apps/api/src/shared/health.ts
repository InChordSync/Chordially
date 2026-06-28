import { IncomingMessage, ServerResponse } from "http";

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  uptime: number;
  timestamp: string;
}

function getHealthStatus(): HealthStatus {
  return {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

export function healthHandler(_req: IncomingMessage, res: ServerResponse): void {
  const status = getHealthStatus();
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(status));
}

export function readinessHandler(_req: IncomingMessage, res: ServerResponse): void {
  const isReady = process.uptime() > 2;
  res.writeHead(isReady ? 200 : 503, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ready: isReady, uptime: process.uptime() }));
}
