type LogLevel = "info" | "warn" | "error";

interface SafeLogEntry {
  level: LogLevel;
  message: string;
  code?: string;
  timestamp: string;
}

function sanitize(message: string): string {
  return message
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, "[email]")
    .replace(/\bghp_[A-Za-z0-9]+\b/g, "[token]")
    .replace(/\b\d{13,19}\b/g, "[card]");
}

export function safeLog(level: LogLevel, message: string, code?: string): void {
  const entry: SafeLogEntry = {
    level,
    message: sanitize(message),
    code,
    timestamp: new Date().toISOString(),
  };
  console[level === "error" ? "error" : "log"](JSON.stringify(entry));
}

export const logger = {
  info: (msg: string, code?: string) => safeLog("info", msg, code),
  warn: (msg: string, code?: string) => safeLog("warn", msg, code),
  error: (msg: string, code?: string) => safeLog("error", msg, code),
};
