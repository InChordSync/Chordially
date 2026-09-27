import {
  structuredLogEntrySchema,
  type StructuredLogEntry,
} from '@chordially/shared';

export class StructuredRequestLogger {
  public static createLogEntry(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    traceId?: string
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      level: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
      message: `HTTP ${method} ${path} - ${statusCode}`,
      method,
      path,
      statusCode,
      durationMs,
      trace: {
        traceId: traceId ?? `tr_${Date.now()}`,
        requestId: `req_${Math.random().toString(36).substring(2, 10)}`,
      },
      timestamp: new Date().toISOString(),
    };

    return structuredLogEntrySchema.parse(entry);
  }
}
