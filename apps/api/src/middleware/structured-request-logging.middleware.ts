import {
  structuredLogEntrySchema,
  type StructuredLogEntry,
} from '@chordially/shared';

export interface RequestLogTrace {
  /** Correlation id for the request, resolved from the x-request-id header. */
  requestId: string;
  traceId?: string;
  clientIp?: string;
  userAgent?: string;
}

export class StructuredRequestLogger {
  /**
   * Builds the per-request summary entry.
   *
   * The `trace` object is passed in rather than derived here because the
   * correlation id is resolved once per request by the logging interceptor and
   * has to be the same id the request carried through its handlers — a second
   * value minted at log time would not match the one already emitted.
   */
  public static createLogEntry(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    trace: RequestLogTrace
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      level: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
      message: `HTTP ${method} ${path} - ${statusCode}`,
      method,
      path,
      statusCode,
      durationMs,
      trace: {
        traceId: trace.traceId ?? `tr_${Date.now()}`,
        requestId: trace.requestId,
        ...(trace.clientIp ? { clientIp: trace.clientIp } : {}),
        ...(trace.userAgent ? { userAgent: trace.userAgent } : {}),
      },
      timestamp: new Date().toISOString(),
    };

    return structuredLogEntrySchema.parse(entry);
  }
}
