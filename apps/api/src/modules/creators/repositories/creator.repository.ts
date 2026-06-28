import { prisma } from "../../../shared/database/prisma.js"
import type {
  AvailabilitySlot,
  CreateCreatorInput,
  CreatorProfile,
  UpdateCreatorInput,
} from "../types/creator.types.js"

type RawCreatorProfile = {
  id: string
  userId: string
  displayName: string
  slug: string
  bio: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  genre: string | null
  location: string | null
  tags: string
  activityScore: number
  lastActiveAt: Date | null
  availability: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

function fromPrisma(raw: RawCreatorProfile): CreatorProfile {
  return {
    ...raw,
    tags: JSON.parse(raw.tags) as string[],
    availability: JSON.parse(raw.availability) as AvailabilitySlot[],
  }
}

export const creatorRepository = {
  async findById(id: string): Promise<CreatorProfile | null> {
    const raw = await prisma.creatorProfile.findUnique({ where: { id } })
    return raw ? fromPrisma(raw as unknown as RawCreatorProfile) : null
  },

  async findBySlug(slug: string): Promise<CreatorProfile | null> {
    const raw = await prisma.creatorProfile.findUnique({ where: { slug } })
    return raw ? fromPrisma(raw as unknown as RawCreatorProfile) : null
  },

  async findByUserId(userId: string): Promise<CreatorProfile | null> {
    const raw = await prisma.creatorProfile.findUnique({ where: { userId } })
    return raw ? fromPrisma(raw as unknown as RawCreatorProfile) : null
  },

  async create(
    input: CreateCreatorInput & { slug: string }
  ): Promise<CreatorProfile> {
    const raw = await prisma.creatorProfile.create({
      data: {
        userId: input.userId,
        displayName: input.displayName,
        slug: input.slug,
        bio: input.bio ?? null,
        genre: input.genre ?? null,
        location: input.location ?? null,
      },
    })
    return fromPrisma(raw as unknown as RawCreatorProfile)
  },

  async update(
    id: string,
    input: UpdateCreatorInput
  ): Promise<CreatorProfile> {
    const { tags, ...rest } = input
    const data: Record<string, unknown> = { ...rest }
    if (tags !== undefined) {
      data.tags = JSON.stringify(tags)
    }
    const raw = await prisma.creatorProfile.update({
      where: { id },
      data,
    })
    return fromPrisma(raw as unknown as RawCreatorProfile)
  },

  async updateTags(id: string, tags: string[]): Promise<CreatorProfile> {
    const raw = await prisma.creatorProfile.update({
      where: { id },
      data: { tags: JSON.stringify(tags) },
    })
    return fromPrisma(raw as unknown as RawCreatorProfile)
  },

  async updateAvailability(
    id: string,
    availability: AvailabilitySlot[]
  ): Promise<CreatorProfile> {
    const raw = await prisma.creatorProfile.update({
      where: { id },
      data: { availability: JSON.stringify(availability) },
    })
    return fromPrisma(raw as unknown as RawCreatorProfile)
  },

  async updateActivity(
    id: string,
    score: number
  ): Promise<CreatorProfile> {
    const raw = await prisma.creatorProfile.update({
      where: { id },
      data: { activityScore: score, lastActiveAt: new Date() },
    })
    return fromPrisma(raw as unknown as RawCreatorProfile)
  },

  async getFollowerCount(creatorId: string): Promise<number> {
    const profile = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { userId: true },
    })
    if (!profile) return 0
    return prisma.follow.count({ where: { followingId: profile.userId } })
  },

  async getBookmarkCount(creatorId: string): Promise<number> {
    return prisma.bookmark.count({ where: { creatorId } })
  },
}
