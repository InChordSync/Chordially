import type { NextFunction, Request, Response } from 'express'
import { campaignService } from '../services/campaign.service.js'

export const campaignController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, goal, currency, deadline } = req.body
      const campaign = await campaignService.create({
        creatorId: req.userId!,
        title, description, goal, currency: currency || 'XLM', deadline,
      })
      res.status(201).json({ campaign })
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await campaignService.getById(req.params.id)
      if (!campaign) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Campaign not found' } }); return }
      res.status(200).json({ campaign })
    } catch (error) {
      next(error)
    }
  },

  async getMyCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await campaignService.getByCreator(req.userId!)
      res.status(200).json({ campaigns })
    } catch (error) {
      next(error)
    }
  },

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await campaignService.publish(req.params.id)
      res.status(200).json({ campaign })
    } catch (error) {
      next(error)
    }
  },
}
