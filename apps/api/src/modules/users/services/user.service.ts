import { userRepository } from "../repositories/user.repository.js"
import type { CreateUserInput, User } from "../types/user.types.js"

export const userService = {
  findByEmail(email: string): Promise<User | null> {
    return userRepository.findByEmail(email)
  },

  findById(id: string): Promise<User | null> {
    return userRepository.findById(id)
  },

  create(input: CreateUserInput): Promise<User> {
    return userRepository.create(input)
  },

  update(
    id: string,
    data: Partial<Pick<User, "emailVerified" | "failedLoginAttempts" | "lockedUntil" | "passwordHash">>
  ): Promise<User> {
    return userRepository.update(id, data)
  },
}
