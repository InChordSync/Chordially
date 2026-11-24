import type { Prisma } from "@prisma/client"
import { prisma } from "../../../shared/database/prisma.js"
import type {
  CreateCreatorInput,
  CreatorProfile,
  UpdateCreatorInput,
} from "../types/creator.types.js"

type DbClient = Prisma.TransactionClient

export const creatorRepository = {
  findById(id: string, tx?: DbClient): Promise<CreatorProfile | null> {
    const client = tx ?? prisma
    return client.creatorProfile.findUnique({ where: { id } })
  },

  findBySlug(slug: string, tx?: DbClient): Promise<CreatorProfile | null> {
    const client = tx ?? prisma
    return client.creatorProfile.findUnique({ where: { slug } })
  },

  findByUserId(userId: string, tx?: DbClient): Promise<CreatorProfile | null> {
    const client = tx ?? prisma
    return client.creatorProfile.findUnique({ where: { userId } })
  },

  search(filters: { q?: string; genre?: string; location?: string }): Promise<CreatorProfile[]> {
    return prisma.creatorProfile.findMany({
      where: {
        ...(filters.genre ? { genre: { contains: filters.genre } } : {}),
        ...(filters.location ? { location: { contains: filters.location } } : {}),
      },
      orderBy: { createdAt: "asc" },
    })
  },

  create(input: CreateCreatorInput & { slug: string }): Promise<CreatorProfile> {
    return prisma.creatorProfile.create({
      data: {
        userId: input.userId,
        displayName: input.displayName,
        slug: input.slug,
        bio: input.bio,
        genre: input.genre,
        location: input.location,
      },
    })
  },

  update(id: string, input: UpdateCreatorInput, tx?: DbClient): Promise<CreatorProfile> {
    const client = tx ?? prisma
    return client.creatorProfile.update({
      where: { id },
      data: input,
    })
  },
}
