/**
 * NestJS-native UsersService (N-023) — ports the read side of the Express
 * `userService`/`userRepository` (see `./user.service.ts`) into Nest's
 * provider pattern, going through a `PrismaService` directly rather than
 * a hand-rolled repository, per this issue's own description.
 *
 * No `PrismaService` provider exists yet anywhere in the codebase (only a
 * bare exported `PrismaClient` instance in `shared/database/prisma.ts`),
 * so a minimal one is defined here rather than in a shared location —
 * consolidating it into one canonical `PrismaService` used by every module
 * is a natural follow-up once more modules migrate off the plain
 * `PrismaClient` export, left for a maintainer since `shared/database/`
 * is a likely point of contention across the other N-0xx issues in this
 * batch.
 *
 * Kept in a new file (rather than editing the existing
 * `services/user.service.ts`) so the Express-flavored singleton and this
 * Nest provider can coexist during the migration without either one
 * breaking the other's callers.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

/** Same shape the Express `User` type exposes, so callers migrate without a shape change. */
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the user for `id`, or `null` if none exists — identical return shape to the Express version. */
  async findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Returns the user for `email`, or `null` if none exists — identical return shape to the Express version. */
  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
