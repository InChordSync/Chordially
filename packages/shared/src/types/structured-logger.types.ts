export type LoggerLogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface RequestTraceContext {
  traceId: string;
  requestId: string;
  clientIp?: string;
  userAgent?: string;
}

export interface StructuredLogEntry {
  level: LoggerLogLevel;
  message: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  trace: RequestTraceContext;
  timestamp: string;
}
