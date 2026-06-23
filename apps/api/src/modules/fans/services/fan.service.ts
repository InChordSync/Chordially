import { AppError } from "../../../shared/errors/app-error.js"
import { fanRepository } from "../repositories/fan.repository.js"
import type {
  CreateFanProfileInput,
  FanProfile,
  UpdateFanProfileInput,
} from "../types/fan.types.js"

export const fanService = {
  findByUserId(userId: string): Promise<FanProfile | null> {
    return fanRepository.findByUserId(userId)
  },

  findById(id: string): Promise<FanProfile | null> {
    return fanRepository.findById(id)
  },

  async createFanProfile(input: CreateFanProfileInput): Promise<FanProfile> {
    const existing = await fanRepository.findByUserId(input.userId)
    if (existing) return existing

    return fanRepository.create(input)
  },

  async updateFanProfile(
    id: string,
    input: UpdateFanProfileInput,
    requestingUserId: string
  ): Promise<FanProfile> {
    const profile = await fanRepository.findById(id)
    if (!profile) {
      throw new AppError(404, "FAN_NOT_FOUND", "Fan profile not found")
    }

    if (profile.userId !== requestingUserId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You do not have permission to edit this profile"
      )
    }

    return fanRepository.update(id, input)
  },

  async updateGenrePrefs(
    id: string,
    genrePrefs: string[],
    requestingUserId: string
  ): Promise<FanProfile> {
    const profile = await fanRepository.findById(id)
    if (!profile) {
      throw new AppError(404, "FAN_NOT_FOUND", "Fan profile not found")
    }

    if (profile.userId !== requestingUserId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You do not have permission to edit this profile"
      )
    }

    return fanRepository.setGenrePrefs(id, genrePrefs)
  },
}
