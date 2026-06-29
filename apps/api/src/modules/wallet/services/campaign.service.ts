import { prisma } from '../../../shared/database/prisma.js'
import { v4 as uuid } from 'uuid'
import type { CampaignMetadata } from '@chordially/shared'

export const campaignService = {
  async create(data: {
    creatorId: string
    title: string
    description: string
    goal: number
    currency: string
    deadline: string
  }): Promise<CampaignMetadata> {
    const campaign = await prisma.campaign.create({
      data: {
        id: uuid(),
        creatorId: data.creatorId,
        title: data.title,
        description: data.description,
        goal: data.goal,
        currency: data.currency,
        deadline: new Date(data.deadline),
        status: 'draft',
      },
    })
    return this.toCampaign(campaign)
  },

  async update(id: string, data: Partial<CampaignMetadata>): Promise<CampaignMetadata> {
    const campaign = await prisma.campaign.update({ where: { id }, data })
    return this.toCampaign(campaign)
  },

  async publish(id: string): Promise<CampaignMetadata> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'active' },
    })
    return this.toCampaign(campaign)
  },

  async getById(id: string): Promise<CampaignMetadata | null> {
    const campaign = await prisma.campaign.findUnique({ where: { id } })
    return campaign ? this.toCampaign(campaign) : null
  },

  async getByCreator(creatorId: string): Promise<CampaignMetadata[]> {
    const campaigns = await prisma.campaign.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    })
    return campaigns.map(c => this.toCampaign(c))
  },

  toCampaign(c: any): CampaignMetadata {
    return {
      id: c.id,
      creatorId: c.creatorId,
      title: c.title,
      description: c.description,
      goal: Number(c.goal),
      currency: c.currency,
      deadline: c.deadline.toISOString(),
      status: c.status,
      progress: Number(c.progress || 0),
      rewardTiers: [],
      createdAt: c.createdAt.toISOString(),
    }
  },
}
