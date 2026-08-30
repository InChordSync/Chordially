import { beforeEach, describe, expect, it } from "vitest"
import { CreatorCampaignService } from "../services/creator-campaign.service.js"
import type { CampaignMetadataRecord } from "@chordially/shared"

function campaignInput(overrides: Partial<CampaignMetadataRecord> = {}) {
  return {
    campaignId: "camp_1",
    creatorId: "creator_1",
    title: "Launch Tour",
    description: "Help fund the national tour",
    goal: { targetAmountCents: 5_000_00, currency: "USD", deadlineIsoDate: "2026-12-31T23:59:59Z" },
    status: "draft" as const,
    createdAt: "2026-08-30T00:00:00Z",
    ...overrides,
  }
}

describe("CreatorCampaignService", () => {
  let service: CreatorCampaignService

  beforeEach(() => {
    service = new CreatorCampaignService()
  })

  it("creates and retrieves a validated campaign", async () => {
    const created = await service.createCampaign(campaignInput())
    const fetched = await service.getCampaign("camp_1")

    expect(created.campaignId).toBe("camp_1")
    expect(fetched?.title).toBe("Launch Tour")
  })

  it("returns null for an unknown campaign", async () => {
    await expect(service.getCampaign("missing")).resolves.toBeNull()
  })

  it("rejects a campaign whose title is too short", async () => {
    await expect(service.createCampaign(campaignInput({ title: "ab" }))).rejects.toThrow()
  })

  it("rejects a campaign with a non-positive goal", async () => {
    await expect(
      service.createCampaign(
        campaignInput({ goal: { ...campaignInput().goal, targetAmountCents: 0 } })
      )
    ).rejects.toThrow()
  })
})
