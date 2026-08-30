import { prisma } from "../../../shared/database/prisma.js"
import type { CreateUserInput, User } from "../types/user.types.js"

export const userRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  },

  create(input: CreateUserInput): Promise<User> {
    return prisma.user.create({ data: input })
  },

  update(id: string, data: Partial<Pick<User, "emailVerified" | "failedLoginAttempts" | "lockedUntil" | "passwordHash">>): Promise<User> {
    return prisma.user.update({ where: { id }, data })
  },
}
