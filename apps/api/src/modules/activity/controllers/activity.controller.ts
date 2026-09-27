import type { NextFunction, Request, Response } from "express"
import { ActivityStreamService } from "../services/activity-stream.service.js"

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 20

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback
  }
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback
  }
  return parsed
}

export const activityController = {
  list(req: Request, res: Response, next: NextFunction): void {
    try {
      const creatorId =
        typeof req.query.creatorId === "string" && req.query.creatorId.length > 0
          ? req.query.creatorId
          : undefined
      const page = parsePositiveInt(req.query.page, 1)
      const requestedPageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE)
      const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
      const offset = (page - 1) * pageSize

      const all = ActivityStreamService.getActivities(undefined, Number.MAX_SAFE_INTEGER)
      const total = creatorId
        ? all.filter((item) => item.creatorId === creatorId).length
        : all.length
      const items = ActivityStreamService.getActivities(creatorId, pageSize, offset)
      const totalPages = Math.ceil(total / pageSize)

      res.status(200).json({
        items,
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
      })
    } catch (error) {
      next(error)
    }
  },
}
