import crypto from "node:crypto"
import { prisma } from "../../../shared/database/prisma.js"
import { AppError } from "../../../shared/errors/app-error.js"

/**
 * Account deletion for users who have financial history.
 *
 * Tip, payout and deposit rows are `onDelete: Restrict` so deleting a User
 * can never silently erase the audit trail. Instead of hard-deleting, call
 * this service: it strips directly identifying data from the user and their
 * profiles while leaving every money row (and its foreign keys) untouched.
 * Reconciliation, disputes and audits therefore keep a stable user id whose
 * identity is no longer recoverable from the database.
 */
export const userAnonymisationService = {
  async anonymise(userId: string): Promise<{ userId: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found")
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@invalid.chordially.local`,
          passwordHash: crypto.randomBytes(32).toString("hex"),
          emailVerified: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.creatorProfile.updateMany({
        where: { userId },
        data: {
          displayName: "Deleted user",
          bio: null,
          avatarUrl: null,
          location: null,
          genre: null,
        },
      }),
      prisma.fanProfile.updateMany({
        where: { userId },
        data: { displayName: "Deleted user", avatarUrl: null, genrePrefs: "[]" },
      }),
    ])

    return { userId }
  },
}
