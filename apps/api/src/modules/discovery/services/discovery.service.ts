import { prisma } from "../../../shared/database/prisma.js"
import type { DiscoveryResponse, DiscoveryCreator } from "@chordially/shared"

const DISCOVERY_PAGE_SIZE_LIMIT = 50

interface DiscoveryFilters {
  genre?: string
  location?: string
  sort: "freshness" | "activity" | "followers"
  page: number
  limit: number
  genrePrefs?: string[]
}

export const discoveryService = {
  async discover(
    userId: string | undefined,
    filters: DiscoveryFilters
  ): Promise<DiscoveryResponse> {
    const page = Math.max(1, filters.page)
    const limit = Math.min(Math.max(1, filters.limit), DISCOVERY_PAGE_SIZE_LIMIT)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (filters.genre) {
      where.genre = filters.genre
    }

    if (filters.location) {
      where.location = { contains: filters.location }
    }

    const orderBy: Record<string, string> =
      filters.sort === "activity"
        ? { activityScore: "desc" }
        : filters.sort === "followers"
          ? { updatedAt: "desc" }
          : { createdAt: "desc" }

    const [total, creators] = await Promise.all([
      prisma.creatorProfile.count({ where }),
      prisma.creatorProfile.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    const creatorsResponse: DiscoveryCreator[] = creators.map((c) => ({
      id: c.id,
      userId: c.userId,
      displayName: c.displayName,
      slug: c.slug,
      bio: c.bio,
      avatarUrl: c.avatarUrl,
      genre: c.genre,
      location: c.location,
      tags: JSON.parse(c.tags) as string[],
      activityScore: c.activityScore,
      followerCount: 0,
      isVerified: c.isVerified,
      createdAt: c.createdAt.toISOString(),
    }))

    return {
      creators: creatorsResponse,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  },
}
