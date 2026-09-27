# Creator Campaign Creation Wizard Specification

This document specifies the creator campaign creation wizard steps, goal schemas, and campaign management services in Chordially.

## Components & Modules

1. **Campaign Service**:
   - `apps/api/src/modules/campaigns/services/creator-campaign.service.ts`: `CreatorCampaignService` handling campaign creation and metadata persistence.

2. **Web Wizard UI**:
   - `CampaignCreationWizardModal`: React UI component guiding creators through campaign setup steps.

3. **Validation Schemas & Interfaces**:
   - `campaignMetadataRecordSchema` and `CampaignTargetGoal` defined in `@chordially/shared`.
