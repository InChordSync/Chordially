import { Router } from 'express'
import { campaignController } from '../controllers/campaign.controller.js'
import { requireAuth } from '../../../shared/middleware/auth.middleware.js'

export const campaignRouter: Router = Router()

campaignRouter.use(requireAuth)
campaignRouter.post('/', campaignController.create)
campaignRouter.get('/', campaignController.getMyCampaigns)
campaignRouter.get('/:id', campaignController.getById)
campaignRouter.patch('/:id/publish', campaignController.publish)
