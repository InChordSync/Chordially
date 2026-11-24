import { prisma } from "../../../shared/database/prisma.js"
import type { CreateStreamInput, Stream } from "../types/stream.types.js"

export const streamRepository = {
  findById(id: string): Promise<Stream | null> {
    return prisma.stream.findUnique({ where: { id } })
  },

  findOpenByCreator(creatorId: string): Promise<Stream | null> {
    return prisma.stream.findFirst({
      where: { creatorId, endedAt: null },
      orderBy: { startedAt: "desc" },
    })
  },

  create(input: CreateStreamInput): Promise<Stream> {
    return prisma.stream.create({
      data: { creatorId: input.creatorId, title: input.title },
    })
  },

  end(id: string): Promise<Stream> {
    return prisma.stream.update({ where: { id }, data: { endedAt: new Date() } })
  },
}
