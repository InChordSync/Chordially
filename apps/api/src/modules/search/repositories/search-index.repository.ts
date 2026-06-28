import { prisma } from "../../../shared/database/prisma.js"

interface SearchIndexEntry {
  id: string
  creatorId: string
  displayName: string
  slug: string
  bio: string | null
  genre: string | null
  location: string | null
  tags: string[]
  activityScore: number
  followerCount: number
  indexedAt: Date
  updatedAt: Date
}

type RawSearchIndexEntry = {
  id: string
  creatorId: string
  displayName: string
  slug: string
  bio: string | null
  genre: string | null
  location: string | null
  tags: string
  activityScore: number
  followerCount: number
  indexedAt: Date
  updatedAt: Date
}

function fromPrisma(raw: RawSearchIndexEntry): SearchIndexEntry {
  return {
    ...raw,
    tags: JSON.parse(raw.tags) as string[],
  }
}

export const searchIndexRepository = {
  async findByCreatorId(
    creatorId: string
  ): Promise<SearchIndexEntry | null> {
    const raw = await prisma.searchIndexEntry.findUnique({
      where: { creatorId },
    })
    return raw ? fromPrisma(raw as unknown as RawSearchIndexEntry) : null
  },

  async upsert(
    creatorId: string,
    data: {
      displayName: string
      slug: string
      bio: string | null
      genre: string | null
      location: string | null
      tags: string[]
      activityScore: number
      followerCount: number
    }
  ): Promise<SearchIndexEntry> {
    const raw = await prisma.searchIndexEntry.upsert({
      where: { creatorId },
      create: {
        creatorId,
        displayName: data.displayName,
        slug: data.slug,
        bio: data.bio,
        genre: data.genre,
        location: data.location,
        tags: JSON.stringify(data.tags),
        activityScore: data.activityScore,
        followerCount: data.followerCount,
      },
      update: {
        displayName: data.displayName,
        slug: data.slug,
        bio: data.bio,
        genre: data.genre,
        location: data.location,
        tags: JSON.stringify(data.tags),
        activityScore: data.activityScore,
        followerCount: data.followerCount,
      },
    })
    return fromPrisma(raw as unknown as RawSearchIndexEntry)
  },

  async delete(creatorId: string): Promise<void> {
    await prisma.searchIndexEntry.delete({
      where: { creatorId },
    })
  },

  async search(params: {
    query: string
    genre?: string
    location?: string
    skip: number
    take: number
  }): Promise<{ entries: SearchIndexEntry[]; total: number }> {
    const { query, genre, location, skip, take } = params

    const where: Record<string, unknown> = {
      OR: [
        { displayName: { contains: query } },
        { bio: { contains: query } },
        { genre: { contains: query } },
        { location: { contains: query } },
      ],
    }

    if (genre) {
      where.genre = genre
    }

    if (location) {
      where.location = { contains: location }
    }

    const [total, rawEntries] = await Promise.all([
      prisma.searchIndexEntry.count({ where }),
      prisma.searchIndexEntry.findMany({
        where,
        orderBy: { activityScore: "desc" },
        skip,
        take,
      }),
    ])

    return {
      total,
      entries: rawEntries.map(
        (e) => fromPrisma(e as unknown as RawSearchIndexEntry)
      ),
    }
  },
}
