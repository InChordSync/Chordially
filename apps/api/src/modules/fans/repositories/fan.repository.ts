import type { Prisma } from "@prisma/client"
import { prisma } from "../../../shared/database/prisma.js"
import type {
  CreateFanProfileInput,
  FanProfile,
  UpdateFanProfileInput,
} from "../types/fan.types.js"

type DbClient = Prisma.TransactionClient

type RawFanProfile = {
  id: string
  userId: string
  displayName: string
  avatarUrl: string | null
  genrePrefs: string
  createdAt: Date
  updatedAt: Date
}

function fromPrisma(raw: RawFanProfile): FanProfile {
  return {
    ...raw,
    genrePrefs: JSON.parse(raw.genrePrefs) as string[],
  }
}

export const fanRepository = {
  async findByUserId(userId: string, tx?: DbClient): Promise<FanProfile | null> {
    const client = tx ?? prisma
    const raw = await client.fanProfile.findUnique({ where: { userId } })
    return raw ? fromPrisma(raw) : null
  },

  async findById(id: string, tx?: DbClient): Promise<FanProfile | null> {
    const client = tx ?? prisma
    const raw = await client.fanProfile.findUnique({ where: { id } })
    return raw ? fromPrisma(raw) : null
  },

  async create(input: CreateFanProfileInput): Promise<FanProfile> {
    const raw = await prisma.fanProfile.create({
      data: {
        userId: input.userId,
        displayName: input.displayName,
      },
    })
    return fromPrisma(raw)
  },

  async update(id: string, input: UpdateFanProfileInput, tx?: DbClient): Promise<FanProfile> {
    const client = tx ?? prisma
    const raw = await client.fanProfile.update({
      where: { id },
      data: input,
    })
    return fromPrisma(raw)
  },

  async setGenrePrefs(id: string, genrePrefs: string[], tx?: DbClient): Promise<FanProfile> {
    const client = tx ?? prisma
    const raw = await client.fanProfile.update({
      where: { id },
      data: { genrePrefs: JSON.stringify(genrePrefs) },
    })
    return fromPrisma(raw)
  },
}
