import {
  campaignMetadataRecordSchema,
  type CampaignMetadataRecord,
  type CampaignMetadataRecordInput,
} from '@chordially/shared';

export class CreatorCampaignService {
  private readonly campaigns: Map<string, CampaignMetadataRecord> = new Map();

  public async createCampaign(input: CampaignMetadataRecordInput): Promise<CampaignMetadataRecord> {
    const validated = campaignMetadataRecordSchema.parse(input);
    this.campaigns.set(validated.campaignId, validated);
    return validated;
  }

  public async getCampaign(campaignId: string): Promise<CampaignMetadataRecord | null> {
    return this.campaigns.get(campaignId) ?? null;
  }
}
