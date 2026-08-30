import {
  sanitizedWalletLogPayloadSchema,
  type SanitizedWalletLogPayload,
  type WalletAuditEventType,
} from '@chordially/shared';
import { logger } from '../../../shared/logger/logger.js';

export class WalletAuditLoggerService {
  public logWalletEvent(
    sessionId: string,
    rawWalletAddress: string,
    eventType: WalletAuditEventType
  ): SanitizedWalletLogPayload {
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

    const validated = sanitizedWalletLogPayloadSchema.parse(payload);

    // Persist the sanitized entry so wallet link/challenge events leave an
    // audit trail for security review and incident response. The raw wallet
    // address is never logged — only the masked form.
    logger.info('wallet audit event', {
      eventId: validated.eventId,
      ...validated.meta,
      timestamp: validated.timestamp,
    });

    return validated;
  }
}

export const walletAuditLogger = new WalletAuditLoggerService();
