import type { NextFunction, Request, Response } from "express"
import { prisma } from "../../../shared/database/prisma.js"
import { toCreatorResponse } from "../types/creator.types.js"
import { rankTrending, type TrendingSignal } from "../services/trending-creators.service.js"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

async function buildTrendingSignals(): Promise<TrendingSignal[]> {
  const creators = await prisma.creatorProfile.findMany()

  const since = new Date(Date.now() - SEVEN_DAYS_MS)
  const [streams, tipCounts] = await Promise.all([
    prisma.stream.groupBy({
      by: ["creatorId"],
      _count: { _all: true },
      where: { startedAt: { gte: since } },
    }),
    prisma.tip.groupBy({
      by: ["creatorId", "fanUserId"],
      _count: { _all: true },
    }),
  ])

  const streamCountByCreator = new Map(
    streams.map((row) => [row.creatorId, row._count._all])
  )
  const followerCountByCreator = new Map<string, number>()
  for (const row of tipCounts) {
    followerCountByCreator.set(
      row.creatorId,
      (followerCountByCreator.get(row.creatorId) ?? 0) + 1
    )
  }

  return creators.map((creator) => ({
    creatorId: creator.id,
    followerCount: followerCountByCreator.get(creator.id) ?? 0,
    newFollowers7d: 0,
    streamCount7d: streamCountByCreator.get(creator.id) ?? 0,
  }))
}

export const trendingController = {
  async getTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 20
      const signals = await buildTrendingSignals()
      const ranked = rankTrending(signals, limit)

      const profiles = await prisma.creatorProfile.findMany({
        where: { id: { in: ranked.map((signal) => signal.creatorId) } },
      })
      const byId = new Map(profiles.map((profile) => [profile.id, profile]))

      const items = ranked
        .map((signal) => byId.get(signal.creatorId))
        .filter((profile) => profile !== undefined)
        .map((profile) => toCreatorResponse(profile!))

      res.status(200).json({ items })
    } catch (error) {
      next(error)
    }
  },
}
