/**
 * Passport JWT strategy (N-014) — replaces the manual `requireAuth` Express
 * middleware (see `shared/middleware/auth.middleware.ts`) with Nest's
 * strategy pattern, while keeping the exact same token contract: bearer
 * token (or the `chordially.token` cookie), `{ sub: userId }` payload,
 * `env.JWT_SECRET`, and the same `401 UNAUTHORIZED` error envelope on any
 * failure (missing/malformed/expired/invalid signature) — all via N-007's
 * `AppError`.
 *
 * Attaches `{ userId }` to `request.user`, matching the existing
 * `req.userId` convention elsewhere in the codebase (see `requireRole`'s
 * comment on reading role fresh from the DB rather than the JWT).
 *
 * Not yet wired into `AuthModule`'s providers/imports (`PassportModule`,
 * `JwtModule`) — that's a follow-up left for a maintainer, since
 * `auth.module.ts` is a natural point of contention for the other N-01x
 * issues landing in this same batch (JwtAuthGuard, refresh tokens).
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { env } from '../../../shared/config/env.js';
import { AppError } from '../../../shared/errors/app-error.js';

export interface AccessTokenPayload {
  sub: string;
}

export interface AuthenticatedUser {
  userId: string;
}

const AUTH_TOKEN_COOKIE = 'chordially.token';

/**
 * Reads the token from the `chordially.token` cookie when there's no
 * `Authorization: Bearer` header, mirroring `requireAuth`'s fallback so
 * cookie-authenticated clients (the web app) keep working unchanged.
 */
function cookieExtractor(req: Request): string | null {
  const raw = (req as Request & { cookies?: Record<string, string> }).cookies?.[AUTH_TOKEN_COOKIE];
  return typeof raw === 'string' ? raw : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  /**
   * Called by Passport once the token's signature and expiry have already
   * been verified. Anything thrown here (or a falsy return) becomes a 401
   * via Passport's default flow — we throw the codebase's own `AppError`
   * instead of Nest's `UnauthorizedException` so the response envelope
   * matches `requireAuth`'s `{ code: "UNAUTHORIZED", ... }` shape exactly.
   */
  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (!payload?.sub) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }
    return { userId: payload.sub };
  }
}
