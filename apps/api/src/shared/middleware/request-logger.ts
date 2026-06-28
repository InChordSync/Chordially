import { IncomingMessage, ServerResponse } from "http";

interface RequestLog {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

function logRequest(entry: RequestLog): void {
  console.log(JSON.stringify(entry));
}

export function requestLogger(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  const start = Date.now();
  const { method = "GET", url = "/" } = req;

  res.on("finish", () => {
    logRequest({
      method,
      path: url,
      status: res.statusCode,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  });

  next();
}
