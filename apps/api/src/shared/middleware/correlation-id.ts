import { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "crypto";

const HEADER = "x-correlation-id";

export function getCorrelationId(req: IncomingMessage): string {
  const existing = req.headers[HEADER];
  return Array.isArray(existing) ? existing[0] : existing ?? randomUUID();
}

export function correlationIdMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  const correlationId = getCorrelationId(req);
  res.setHeader(HEADER, correlationId);
  (req as IncomingMessage & { correlationId: string }).correlationId = correlationId;
  next();
}
