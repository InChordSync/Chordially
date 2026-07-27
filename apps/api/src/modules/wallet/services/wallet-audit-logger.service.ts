import {
  sanitizedWalletLogPayloadSchema,
  type SanitizedWalletLogPayload,
  type WalletAuditEventType,
} from '@chordially/shared';

export class WalletAuditLoggerService {
  public logWalletEvent(sessionId: string, rawWalletAddress: string, eventType: WalletAuditEventType): SanitizedWalletLogPayload {
    const masked = rawWalletAddress.length > 8
      ? `${rawWalletAddress.substring(0, 4)}...${rawWalletAddress.substring(rawWalletAddress.length - 4)}`
      : '***';

    const payload: SanitizedWalletLogPayload = {
      eventId: `wlog_${Date.now()}`,
      meta: {
        sessionId,
        maskedWalletAddress: masked,
        eventType,
      },
      timestamp: new Date().toISOString(),
    };

    return sanitizedWalletLogPayloadSchema.parse(payload);
  }
}
