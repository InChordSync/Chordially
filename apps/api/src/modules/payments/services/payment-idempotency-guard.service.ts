import { Prisma } from "@prisma/client";
import {
  duplicateCheckResultSchema,
  type DuplicateCheckResult,
} from '@chordially/shared';
import { prisma } from '../../../shared/database/prisma.js';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export interface IdempotencyGuardInput {
  key: string;
  ownerId: string;
  requestPath: string;
  responseBody: Record<string, unknown>;
  statusCode: number;
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Database-backed idempotency guard.
 *
 * Previously this class kept its records in an in-memory `Map`, which meant
 * records were lost on restart and never shared across API instances, so
 * idempotency guarantees silently broke under horizontal scaling. Records now
 * live in `TransactionIdempotencyRecord` (unique per ownerId+key), so a
 * retried or duplicated client request is detected regardless of which
 * instance serves it. The unique constraint also makes concurrent duplicate
 * submissions fail fast with P2002 instead of racing past the check.
 */
export class PaymentIdempotencyGuardService {
  public async checkOrLockKey(
    key: string,
    ownerId: string
  ): Promise<DuplicateCheckResult> {
    const existing = await prisma.transactionIdempotencyRecord.findUnique({
      where: { ownerId_key: { ownerId, key } },
    });

    if (existing) {
      return duplicateCheckResultSchema.parse({
        isDuplicate: true,
        previousResponse: JSON.parse(existing.responseBody),
        lockedAt: existing.createdAt.toISOString(),
      });
    }

    return duplicateCheckResultSchema.parse({ isDuplicate: false });
  }

  public async saveKeyRecord(input: IdempotencyGuardInput): Promise<void> {
    try {
      await prisma.transactionIdempotencyRecord.create({
        data: {
          key: input.key,
          ownerId: input.ownerId,
          requestPath: input.requestPath,
          responseBody: JSON.stringify(input.responseBody ?? {}),
          statusCode: input.statusCode,
          expiresAt: new Date(Date.now() + DEFAULT_TTL_MS),
        },
      });
    } catch (error) {
      // A concurrent instance may have won the race and created the record
      // first. That's fine — the key is now locked by that writer, and a
      // subsequent checkOrLockKey will surface it as a duplicate.
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }
    }
  }
}

export const paymentIdempotencyGuard = new PaymentIdempotencyGuardService();
