import { prisma } from "../../../shared/database/prisma.js"

export const bookmarkRepository = {
  findByFanId(fanId: string) {
    return prisma.bookmark.findMany({
      where: { fanId },
      orderBy: { createdAt: "desc" },
    })
  },

  findByFanAndCreator(fanId: string, creatorId: string) {
    return prisma.bookmark.findUnique({
      where: { fanId_creatorId: { fanId, creatorId } },
    })
  },

  create(fanId: string, creatorId: string) {
    return prisma.bookmark.create({ data: { fanId, creatorId } })
  },

  deleteByFanAndCreator(fanId: string, creatorId: string) {
    return prisma.bookmark.delete({
      where: { fanId_creatorId: { fanId, creatorId } },
    })
  },
}
