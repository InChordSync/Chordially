import { searchIndexRepository } from "../repositories/search-index.repository.js"
import { prisma } from "../../../shared/database/prisma.js"
import type { SearchResponse, SearchResult } from "@chordially/shared"

const SEARCH_PAGE_SIZE_LIMIT = 50

export const searchIndexService = {
  async indexCreator(creatorId: string): Promise<void> {
    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
    })
    if (!creator) return

    const followerCount = await prisma.follow.count({
      where: { followingId: creator.userId },
    })

    await searchIndexRepository.upsert(creatorId, {
      displayName: creator.displayName,
      slug: creator.slug,
      bio: creator.bio,
      genre: creator.genre,
      location: creator.location,
      tags: JSON.parse(creator.tags) as string[],
      activityScore: creator.activityScore,
      followerCount,
    })
  },

  async removeFromIndex(creatorId: string): Promise<void> {
    try {
      await searchIndexRepository.delete(creatorId)
    } catch {
      // Ignore if entry doesn't exist
    }
  },

  async search(params: {
    q: string
    genre?: string
    location?: string
    page: number
    limit: number
  }): Promise<SearchResponse> {
    const page = Math.max(1, params.page)
    const limit = Math.min(Math.max(1, params.limit), SEARCH_PAGE_SIZE_LIMIT)
    const skip = (page - 1) * limit

    const { entries, total } = await searchIndexRepository.search({
      query: params.q,
      genre: params.genre,
      location: params.location,
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    const results: SearchResult[] = entries.map((e) => ({
      id: e.id,
      creatorId: e.creatorId,
      displayName: e.displayName,
      slug: e.slug,
      bio: e.bio,
      genre: e.genre,
      location: e.location,
      tags: e.tags,
      activityScore: e.activityScore,
      followerCount: e.followerCount,
      indexedAt: e.indexedAt.toISOString(),
    }))

    return {
      results,
      pagination: { page, limit, total, totalPages },
    }
  },
}
