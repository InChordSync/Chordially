import type { NextFunction, Request, Response } from "express"
import { followService } from "../services/follow.service.js"
import { toFollowResponse } from "../types/follow.types.js"

export const followController = {
  async follow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { creatorSlug } = req.params
      const follow = await followService.follow(userId, creatorSlug!)
      res.status(201).json(toFollowResponse(follow))
    } catch (error) {
      next(error)
    }
  },

  async unfollow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { creatorSlug } = req.params
      await followService.unfollow(userId, creatorSlug!)
      res.status(200).json({ ok: true })
    } catch (error) {
      next(error)
    }
  },

  async getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
      const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20))
      const result = await followService.getFollowers(slug!, page, pageSize)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
      const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20))
      const result = await followService.getFollowing(userId, page, pageSize)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getFollowCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const result = await followService.getFollowCount(slug!)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },
}
