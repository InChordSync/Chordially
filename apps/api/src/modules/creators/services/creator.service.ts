import { AppError } from "../../../shared/errors/app-error.js"
import { generateUniqueSlug } from "../../../shared/utils/slug.js"
import { creatorRepository } from "../repositories/creator.repository.js"
import { searchIndexService } from "../../search/services/search-index.service.js"
import type {
  AvailabilitySlot,
  CreateCreatorInput,
  CreatorProfile,
  UpdateCreatorInput,
} from "../types/creator.types.js"

export const creatorService = {
  findById(id: string): Promise<CreatorProfile | null> {
    return creatorRepository.findById(id)
  },

  findBySlug(slug: string): Promise<CreatorProfile | null> {
    return creatorRepository.findBySlug(slug)
  },

  findByUserId(userId: string): Promise<CreatorProfile | null> {
    return creatorRepository.findByUserId(userId)
  },

  async createCreatorProfile(input: CreateCreatorInput): Promise<CreatorProfile> {
    const existing = await creatorRepository.findByUserId(input.userId)
    if (existing) {
      throw new AppError(
        409,
        "CREATOR_PROFILE_EXISTS",
        "A creator profile already exists for this account"
      )
    }

    const slug = await generateUniqueSlug(
      input.displayName,
      creatorRepository.findBySlug
    )

    const profile = await creatorRepository.create({ ...input, slug })

    searchIndexService.indexCreator(profile.id).catch(() => {})

    return profile
  },

  async updateCreatorProfile(
    id: string,
    input: UpdateCreatorInput,
    requestingUserId: string
  ): Promise<CreatorProfile> {
    const profile = await creatorRepository.findById(id)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    if (profile.userId !== requestingUserId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You do not have permission to edit this profile"
      )
    }

    const updated = await creatorRepository.update(id, input)

    searchIndexService.indexCreator(updated.id).catch(() => {})

    return updated
  },

  async updateTags(
    id: string,
    tags: string[],
    requestingUserId: string
  ): Promise<CreatorProfile> {
    const profile = await creatorRepository.findById(id)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    if (profile.userId !== requestingUserId) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to edit this profile")
    }

    const updated = await creatorRepository.updateTags(id, tags)

    searchIndexService.indexCreator(updated.id).catch(() => {})

    return updated
  },

  async updateAvailability(
    id: string,
    availability: AvailabilitySlot[],
    requestingUserId: string
  ): Promise<CreatorProfile> {
    const profile = await creatorRepository.findById(id)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    if (profile.userId !== requestingUserId) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to edit this profile")
    }

    return creatorRepository.updateAvailability(id, availability)
  },

  async activityPing(
    id: string,
    requestingUserId: string
  ): Promise<CreatorProfile> {
    const profile = await creatorRepository.findById(id)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    if (profile.userId !== requestingUserId) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to edit this profile")
    }

    const newScore = profile.activityScore + 1
    const updated = await creatorRepository.updateActivity(id, newScore)

    searchIndexService.indexCreator(updated.id).catch(() => {})

    return updated
  },
}
